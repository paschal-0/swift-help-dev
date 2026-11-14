"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  cancelProfessionalSubscription,
  getProfessionalSubscription,
  getProfessionalSubscriptionInvoices,
  openProfessionalBillingPortal,
  reactivateProfessionalSubscription,
  startProfessionalProCheckout,
  type ProfessionalSubscriptionInvoice,
  type ProfessionalSubscriptionOverview,
} from "@/services/professionalApi";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** A short, plain description of where the subscription stands. */
function statusLabel(overview: ProfessionalSubscriptionOverview) {
  if (!overview.isPro) return { text: "Free plan", tone: "neutral" as const };
  if (overview.graceUntil) {
    return { text: "Payment failed", tone: "warning" as const };
  }
  if (overview.cancelAtPeriodEnd) {
    return { text: "Ending soon", tone: "warning" as const };
  }
  return { text: "Active", tone: "good" as const };
}

const TONE_CLASS = {
  good: "bg-[#D9F8DE] text-[#0D8C24]",
  warning: "bg-[#FEF3C7] text-[#92400E]",
  neutral: "bg-[#EEF2F7] text-[#64748B]",
};

export default function ProfessionalSubscriptionPanel() {
  const [overview, setOverview] = useState<ProfessionalSubscriptionOverview | null>(
    null,
  );
  const [invoices, setInvoices] = useState<ProfessionalSubscriptionInvoice[]>([]);
  const [invoicesUnavailable, setInvoicesUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  /** Which management action is in flight, so only that button is disabled. */
  const [busy, setBusy] = useState<"portal" | "cancel" | "reactivate" | null>(
    null,
  );
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await getProfessionalSubscription();
      setOverview(next);
      if (next.isPro || next.status) {
        const history = await getProfessionalSubscriptionInvoices();
        setInvoices(history.invoices ?? []);
        setInvoicesUnavailable(Boolean(history.unavailable));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load your subscription",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Stripe sends the professional back here after checkout. Entitlement is
  // granted by the webhook, not by this return trip, so a success message is
  // only ever a prompt to re-read the real status.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Payment received. Your Pro plan is being activated.");
      void load();
    } else if (status === "cancelled") {
      toast.info("Checkout cancelled. You are still on the Starter plan.");
    }
    if (status) {
      params.delete("status");
      params.delete("reference");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    }
  }, [load]);

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const result = await startProfessionalProCheckout({
        idempotencyKey: `pro-upgrade-${Date.now()}`,
      });
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      toast.success("You are already on the Pro plan.");
      void load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start the upgrade",
      );
    } finally {
      setUpgrading(false);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    try {
      const { url } = await openProfessionalBillingPortal();
      window.location.assign(url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to open billing management",
      );
      setBusy(null);
    }
  };

  const cancel = async () => {
    setBusy("cancel");
    try {
      const result = await cancelProfessionalSubscription();
      const until = formatDate(result.effectiveAt);
      toast.success(
        until
          ? `Your Pro plan will end on ${until}. You keep Pro until then.`
          : "Your Pro plan has been cancelled.",
      );
      setConfirmingCancel(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel your subscription",
      );
    } finally {
      setBusy(null);
    }
  };

  const reactivate = async () => {
    setBusy("reactivate");
    try {
      await reactivateProfessionalSubscription();
      toast.success("Your Pro plan will continue as normal.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to restart your subscription",
      );
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6 text-[#94A3B8]">
        Loading your subscription...
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-[14px] border border-dashed border-[#C9D7E6] bg-white p-6 text-[#94A3B8]">
        Your subscription could not be loaded.
      </div>
    );
  }

  const status = statusLabel(overview);
  const renewsAt = formatDate(overview.renewsAt);
  const graceUntil = formatDate(overview.graceUntil);
  const periodEnd = formatDate(overview.currentPeriodEnd);

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#94A3B8]">
              Your current plan
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h3 className="text-[24px] font-semibold text-[#334155]">
                {overview.planName}
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-semibold ${TONE_CLASS[status.tone]}`}
              >
                {status.text}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-medium text-[#94A3B8]">
              Commission on consultations
            </p>
            <p className="mt-1 text-[24px] font-semibold text-[#1565C0]">
              {overview.commissionPercentage}%
            </p>
          </div>
        </div>

        {overview.isPro ? (
          <div className="mt-5 border-t border-[#EEF2F7] pt-4 text-[14px] text-[#64748B]">
            {graceUntil ? (
              <p>
                We could not take your last payment. Your Pro benefits continue
                until <span className="font-semibold">{graceUntil}</span>.
                Update your payment method to keep them.
              </p>
            ) : overview.cancelAtPeriodEnd ? (
              <p>
                Your Pro plan ends on{" "}
                <span className="font-semibold">{periodEnd}</span>. You keep Pro
                benefits and the {overview.commissionPercentage}% rate until
                then.
              </p>
            ) : renewsAt ? (
              <p>
                Renews on <span className="font-semibold">{renewsAt}</span>.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 border-t border-[#EEF2F7] pt-4 text-[14px] text-[#64748B]">
            You are on the free Starter plan. Upgrading to Pro halves your
            commission on every chargeable consultation.
          </div>
        )}
      </div>

      {overview.status ? (
        <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6">
          <h4 className="text-[16px] font-semibold text-[#334155]">
            Manage your subscription
          </h4>
          <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
            Payment methods and invoice receipts are handled securely by
            Stripe.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openPortal}
              disabled={busy !== null}
              className="rounded-[10px] border border-[#1565C0] px-4 py-2.5 text-[14px] font-semibold text-[#1565C0] transition hover:bg-[#E3F2FD] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "portal"
                ? "Opening..."
                : "Update payment method and invoices"}
            </button>

            {overview.cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={reactivate}
                disabled={busy !== null}
                className="rounded-[10px] bg-[#1565C0] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "reactivate" ? "Restarting..." : "Keep my Pro plan"}
              </button>
            ) : overview.isPro ? (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                disabled={busy !== null}
                className="rounded-[10px] border border-[#DDE6F0] px-4 py-2.5 text-[14px] font-semibold text-[#64748B] transition hover:border-[#C9D7E6] hover:text-[#334155] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel subscription
              </button>
            ) : null}
          </div>

          {confirmingCancel ? (
            <div className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <p className="text-[14px] font-semibold text-[#92400E]">
                Cancel your Pro plan?
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#92400E]">
                You keep Pro and the {overview.commissionPercentage}%
                commission rate until{" "}
                {formatDate(overview.currentPeriodEnd) ??
                  "the end of your paid period"}
                . After that your commission returns to the Starter rate. You
                will not be charged again.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy !== null}
                  className="rounded-[10px] bg-[#B45309] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "cancel" ? "Cancelling..." : "Yes, cancel at period end"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={busy !== null}
                  className="rounded-[10px] border border-[#DDE6F0] bg-white px-4 py-2 text-[14px] font-semibold text-[#64748B] transition hover:text-[#334155] disabled:cursor-not-allowed"
                >
                  Keep my plan
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {overview.status ? (
        <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6">
          <h4 className="text-[16px] font-semibold text-[#334155]">
            Subscription payments
          </h4>
          <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
            What you have paid for your plan. Your consultation earnings are
            shown separately under Billing and plan.
          </p>

          {invoicesUnavailable ? (
            <div className="mt-4 rounded-[12px] border border-dashed border-[#C9D7E6] p-5 text-[14px] text-[#94A3B8]">
              Your payment history could not be loaded just now. Your
              subscription is unaffected.
            </div>
          ) : invoices.length ? (
            <div className="mt-4 overflow-x-auto rounded-[12px] border border-[#DDE6F0]">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#DDE6F0] text-[12px] font-semibold uppercase text-[#64748B]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id ?? invoice.number}
                      className="border-b border-[#EEF2F7] text-[14px] text-[#334155] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        {formatDate(invoice.createdAt) ?? "-"}
                      </td>
                      <td className="px-4 py-3">{invoice.number ?? "-"}</td>
                      <td className="px-4 py-3">
                        {formatPrice(
                          invoice.amountMinor / 100,
                          invoice.currency,
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {invoice.status ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {invoice.invoicePdf ?? invoice.hostedInvoiceUrl ? (
                          <a
                            href={
                              invoice.invoicePdf ??
                              invoice.hostedInvoiceUrl ??
                              "#"
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#1565C0] hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-[12px] border border-dashed border-[#C9D7E6] p-5 text-[14px] text-[#94A3B8]">
              No subscription payments yet.
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {overview.plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-[14px] border bg-white p-6 ${
              plan.isCurrent
                ? "border-[#1565C0] ring-1 ring-[#1565C0]"
                : "border-[#DDE6F0]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-[18px] font-semibold text-[#334155]">
                {plan.name}
              </h4>
              {plan.isCurrent ? (
                <span className="rounded-full bg-[#EEF2F7] px-3 py-1 text-[12px] font-semibold text-[#64748B]">
                  Current
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-[24px] font-semibold text-[#334155]">
              {plan.monthlyPrice > 0
                ? formatPrice(plan.monthlyPrice, plan.currency)
                : "Free"}
              {plan.monthlyPrice > 0 ? (
                <span className="text-[14px] font-medium text-[#94A3B8]">
                  {" "}
                  / month
                </span>
              ) : null}
            </p>
            {plan.monthlyPrice > 0 && plan.taxInclusive ? (
              <p className="mt-1 text-[12px] text-[#94A3B8]">
                Includes VAT where applicable
              </p>
            ) : null}

            {plan.commissionPercentage !== null ? (
              <p className="mt-3 text-[14px] text-[#64748B]">
                <span className="font-semibold text-[#334155]">
                  {plan.commissionPercentage}%
                </span>{" "}
                commission on chargeable consultations
              </p>
            ) : null}

            {plan.features.length ? (
              <ul className="mt-4 space-y-2 text-[14px] text-[#64748B]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden className="text-[#0D8C24]">
                      &#10003;
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {!plan.isCurrent && plan.monthlyPrice > 0 ? (
              <button
                type="button"
                onClick={upgrade}
                disabled={upgrading}
                className="mt-5 w-full rounded-[10px] bg-[#1565C0] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {upgrading ? "Starting checkout..." : `Upgrade to ${plan.name}`}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <p className="text-[13px] leading-5 text-[#94A3B8]">
        Subscription charges are billed separately from your consultation
        earnings and appear on their own invoices.
      </p>
    </div>
  );
}
