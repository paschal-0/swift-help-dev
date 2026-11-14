"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  cancelOrganizationSubscription,
  changeOrganizationPlan,
  getOrganizationSubscription,
  getOrganizationSubscriptionInvoices,
  openOrganizationBillingPortal,
  previewOrganizationPlanChange,
  reactivateOrganizationSubscription,
  type OrganizationSubscriptionInvoice,
  type OrganizationSubscriptionOverview,
} from "@/services/organizationApi";

type PlanChoice = "starter" | "growth";

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

export default function OrganisationSubscriptionPanel() {
  const [overview, setOverview] =
    useState<OrganizationSubscriptionOverview | null>(null);
  const [invoices, setInvoices] = useState<OrganizationSubscriptionInvoice[]>(
    [],
  );
  const [invoicesUnavailable, setInvoicesUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  /** A plan change the organisation has been quoted but not yet confirmed. */
  const [pendingChange, setPendingChange] = useState<{
    plan: PlanChoice;
    amountDueMinor: number | null;
    currency: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await getOrganizationSubscription();
      setOverview(next);
      if (next.hasSubscription) {
        const history = await getOrganizationSubscriptionInvoices();
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

  const quoteChange = async (plan: PlanChoice) => {
    setBusy(`quote-${plan}`);
    try {
      const preview = await previewOrganizationPlanChange(plan);
      setPendingChange({
        plan,
        amountDueMinor: preview.amountDueMinor,
        currency: preview.currency,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to price that change",
      );
    } finally {
      setBusy(null);
    }
  };

  const confirmChange = async () => {
    if (!pendingChange) return;
    setBusy("change");
    try {
      await changeOrganizationPlan(pendingChange.plan);
      toast.success("Your plan has been changed.");
      setPendingChange(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to change your plan",
      );
    } finally {
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    try {
      const { url } = await openOrganizationBillingPortal();
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
      const result = await cancelOrganizationSubscription();
      const until = formatDate(result.effectiveAt);
      toast.success(
        until
          ? `Your plan will end on ${until}. Your current rate applies until then.`
          : "Your plan has been cancelled.",
      );
      setConfirmingCancel(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to cancel your plan",
      );
    } finally {
      setBusy(null);
    }
  };

  const reactivate = async () => {
    setBusy("reactivate");
    try {
      await reactivateOrganizationSubscription();
      toast.success("Your plan will continue as normal.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to restart your plan",
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

  const renewsAt = formatDate(overview.renewsAt);
  const periodEnd = formatDate(overview.currentPeriodEnd);
  const graceUntil = formatDate(overview.graceUntil);

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#94A3B8]">
              Your current plan
            </p>
            <h3 className="mt-1 text-[24px] font-semibold text-[#334155]">
              {overview.planName}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-medium text-[#94A3B8]">
              Staffing commission
            </p>
            <p className="mt-1 text-[24px] font-semibold text-[#1565C0]">
              {overview.staffingCommissionPercentage}%
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-[#EEF2F7] pt-4 text-[14px] text-[#64748B]">
          {graceUntil ? (
            <p>
              We could not take your last payment. Your current rate continues
              until <span className="font-semibold">{graceUntil}</span>. Update
              your payment method to keep it.
            </p>
          ) : overview.cancelAtPeriodEnd ? (
            <p>
              Your plan ends on{" "}
              <span className="font-semibold">{periodEnd}</span>. Your
              {" "}
              {overview.staffingCommissionPercentage}% staffing rate applies
              until then.
            </p>
          ) : renewsAt ? (
            <p>
              Renews on <span className="font-semibold">{renewsAt}</span>.
            </p>
          ) : (
            <p>
              Your organisation is on the standard staffing rate. A paid plan
              lowers the commission on every shift you fill.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {overview.plans.map((plan) => {
          const choice: PlanChoice =
            plan.planCode === "organization_growth" ? "growth" : "starter";
          return (
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
                {formatPrice(plan.monthlyPrice, plan.currency)}
                <span className="text-[14px] font-medium text-[#94A3B8]">
                  {" "}
                  / month
                </span>
              </p>
              {plan.taxInclusive ? (
                <p className="mt-1 text-[12px] text-[#94A3B8]">
                  Includes VAT where applicable
                </p>
              ) : null}

              <p className="mt-3 text-[14px] text-[#64748B]">
                <span className="font-semibold text-[#334155]">
                  {plan.staffingCommissionPercentage}%
                </span>{" "}
                staffing commission
              </p>

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

              {!plan.isCurrent && overview.hasSubscription ? (
                <button
                  type="button"
                  onClick={() => quoteChange(choice)}
                  disabled={busy !== null}
                  className="mt-5 w-full rounded-[10px] border border-[#1565C0] px-4 py-3 text-[15px] font-semibold text-[#1565C0] transition hover:bg-[#E3F2FD] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === `quote-${choice}`
                    ? "Checking cost..."
                    : `Switch to ${plan.name}`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {pendingChange ? (
        <div className="rounded-[14px] border border-[#BFDBFE] bg-[#EFF6FF] p-5">
          <p className="text-[15px] font-semibold text-[#1E3A8A]">
            Confirm your plan change
          </p>
          <p className="mt-1 text-[14px] leading-5 text-[#1E3A8A]">
            {pendingChange.amountDueMinor !== null && pendingChange.currency ? (
              <>
                Switching to{" "}
                {pendingChange.plan === "growth" ? "Growth" : "Starter"} will
                charge{" "}
                <span className="font-semibold">
                  {formatPrice(
                    pendingChange.amountDueMinor / 100,
                    pendingChange.currency,
                  )}
                </span>{" "}
                now. The time you have already paid for is credited against it.
              </>
            ) : (
              <>
                Switching to{" "}
                {pendingChange.plan === "growth" ? "Growth" : "Starter"} will be
                charged pro rata, crediting the time you have already paid for.
                We could not retrieve the exact figure just now.
              </>
            )}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-[#1E3A8A]">
            The new staffing rate applies to shifts priced from now on. Shifts
            you have already posted keep the rate they were created with.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmChange}
              disabled={busy !== null}
              className="rounded-[10px] bg-[#1565C0] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "change" ? "Changing..." : "Confirm change"}
            </button>
            <button
              type="button"
              onClick={() => setPendingChange(null)}
              disabled={busy !== null}
              className="rounded-[10px] border border-[#BFDBFE] bg-white px-4 py-2 text-[14px] font-semibold text-[#1E3A8A] transition disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {overview.hasSubscription ? (
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
                {busy === "reactivate" ? "Restarting..." : "Keep my plan"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                disabled={busy !== null}
                className="rounded-[10px] border border-[#DDE6F0] px-4 py-2.5 text-[14px] font-semibold text-[#64748B] transition hover:border-[#C9D7E6] hover:text-[#334155] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel subscription
              </button>
            )}
          </div>

          {confirmingCancel ? (
            <div className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <p className="text-[14px] font-semibold text-[#92400E]">
                Cancel your plan?
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#92400E]">
                You keep your {overview.staffingCommissionPercentage}% staffing
                rate until{" "}
                {periodEnd ?? "the end of your paid period"}. After that,
                shifts are charged at the standard rate. You will not be
                charged again.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy !== null}
                  className="rounded-[10px] bg-[#B45309] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "cancel"
                    ? "Cancelling..."
                    : "Yes, cancel at period end"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={busy !== null}
                  className="rounded-[10px] border border-[#DDE6F0] bg-white px-4 py-2 text-[14px] font-semibold text-[#64748B] transition disabled:cursor-not-allowed"
                >
                  Keep my plan
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {overview.hasSubscription ? (
        <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6">
          <h4 className="text-[16px] font-semibold text-[#334155]">
            Plan payments
          </h4>
          <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
            What you have paid for your Swift HELP plan. Your weekly staffing
            invoices are shown separately.
          </p>

          {invoicesUnavailable ? (
            <div className="mt-4 rounded-[12px] border border-dashed border-[#C9D7E6] p-5 text-[14px] text-[#94A3B8]">
              Your payment history could not be loaded just now. Your plan is
              unaffected.
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
              No plan payments yet.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
