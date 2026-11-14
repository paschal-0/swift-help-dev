"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getProfessionalSubscription,
  startProfessionalProCheckout,
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
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const load = useCallback(async () => {
    try {
      setOverview(await getProfessionalSubscription());
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
