"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminCommissionRates,
  getAdminTaxPolicy,
  normalizeAdminLegacyPricing,
  updateAdminTaxPolicy,
  listAdminSubscriptionPlans,
  runAdminSubscriptionReconcile,
  runAdminSubscriptionSweep,
  seedAdminSubscriptionPlans,
  updateAdminCommissionRates,
  updateAdminSubscriptionPlan,
  type AdminCommissionRates,
  type AdminSubscriptionPlan,
  type AdminTaxPolicy,
  type LegacyPricingReport,
} from "@/services/adminApi";
import { getApiErrorMessage } from "@/services/authApi";

type Draft = {
  monthlyPriceMinor: string;
  stripePriceId: string;
  paystackPlanCode: string;
  isActive: boolean;
};

function minorToDisplay(minor: number | null, currency: string) {
  // A plan with no price set is not a free plan. Showing it as 0.00 invites
  // somebody to assume it is configured when nobody has set it.
  if (minor === null || minor === undefined) return "Not configured";
  const amount = minor / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [rates, setRates] = useState<AdminCommissionRates | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [rateDraft, setRateDraft] = useState({ starter: "", pro: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  /** A price change that has been described but not yet agreed to. */
  const [pendingPriceChange, setPendingPriceChange] = useState<{
    planId: string;
    from: string;
    to: string;
  } | null>(null);
  const [pricingReport, setPricingReport] = useState<LegacyPricingReport | null>(
    null,
  );
  const [tax, setTax] = useState<AdminTaxPolicy | null>(null);
  const [taxDrafts, setTaxDrafts] = useState<
    Record<string, { rate: string; label: string; registered: boolean }>
  >({});

  const load = useCallback(async () => {
    try {
      const [planList, rateValues, taxPolicy] = await Promise.all([
        listAdminSubscriptionPlans(),
        getAdminCommissionRates(),
        getAdminTaxPolicy(),
      ]);
      setPlans(planList ?? []);
      setRates(rateValues);
      setTax(taxPolicy);
      setTaxDrafts(
        Object.fromEntries(
          Object.entries(taxPolicy.countries ?? {}).map(([code, rule]) => [
            code,
            {
              rate: String(rule.ratePercentage),
              label: rule.label,
              registered: rule.registered,
            },
          ]),
        ),
      );
      setRateDraft({
        starter: String(rateValues.starterFeePercentage),
        pro: String(rateValues.proFeePercentage),
      });
      setDrafts(
        Object.fromEntries(
          (planList ?? []).map((plan) => [
            plan.id,
            {
              monthlyPriceMinor: String(plan.monthlyPriceMinor ?? 0),
              stripePriceId: plan.stripePriceId ?? "",
              paystackPlanCode: plan.paystackPlanCode ?? "",
              isActive: plan.isActive,
            },
          ]),
        ),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePlan = async (plan: AdminSubscriptionPlan) => {
    const draft = drafts[plan.id];
    if (!draft) return;

    const minor = Number(draft.monthlyPriceMinor);
    if (!Number.isInteger(minor) || minor < 0) {
      toast.error(
        "A price must be a whole number of minor units - pence or kobo - and cannot be negative.",
      );
      return;
    }

    // Moving a price moves what subscribers pay. The change is described and
    // agreed to before it is sent, rather than the server refusing it and the
    // administrator wondering why saving did nothing.
    const movesPrice =
      plan.monthlyPriceMinor !== null && plan.monthlyPriceMinor !== minor;
    if (movesPrice && pendingPriceChange?.planId !== plan.id) {
      setPendingPriceChange({
        planId: plan.id,
        from: minorToDisplay(plan.monthlyPriceMinor, plan.currency),
        to: minorToDisplay(minor, plan.currency),
      });
      return;
    }

    setBusy(plan.id);
    try {
      await updateAdminSubscriptionPlan(plan.id, {
        monthlyPriceMinor: minor,
        stripePriceId: draft.stripePriceId.trim() || null,
        paystackPlanCode: draft.paystackPlanCode.trim() || null,
        isActive: draft.isActive,
        confirmPriceChange: movesPrice ? true : undefined,
      });
      setPendingPriceChange(null);
      toast.success(
        "Saved. This applies to future charges only - anything already settled keeps the rate recorded against it.",
      );
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const saveRates = async () => {
    const starter = Number(rateDraft.starter);
    const pro = Number(rateDraft.pro);
    if (
      !Number.isFinite(starter) ||
      !Number.isFinite(pro) ||
      starter < 0 ||
      pro < 0 ||
      starter > 100 ||
      pro > 100
    ) {
      toast.error("A commission rate must be between 0 and 100 percent.");
      return;
    }

    setBusy("rates");
    try {
      await updateAdminCommissionRates({
        starterFeePercentage: starter,
        proFeePercentage: pro,
      });
      toast.success(
        "Saved. Consultations settling from now on use the new rate; settled ones are unchanged.",
      );
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const saveTax = async (country: string) => {
    const draft = taxDrafts[country];
    if (!draft) return;

    const rate = Number(draft.rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("A tax rate must be between 0 and 100 percent.");
      return;
    }

    setBusy(`tax-${country}`);
    try {
      const updated = await updateAdminTaxPolicy({
        countries: {
          [country]: {
            ratePercentage: rate,
            label: draft.label.trim() || "VAT",
            registered: draft.registered,
          },
        },
      });
      setTax(updated);
      toast.success(
        draft.registered || rate === 0
          ? "Saved."
          : "Saved. No tax will be charged until this country is marked as registered.",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const runTask = async (
    key: string,
    task: () => Promise<unknown>,
    done: string,
  ) => {
    setBusy(key);
    try {
      await task();
      toast.success(done);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6 text-[#94A3B8]">
        Loading plans...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-semibold text-[#334155]">
          Subscriptions and pricing
        </h1>
        <p className="mt-1 max-w-[720px] text-[14px] leading-5 text-[#64748B]">
          Prices are set per country and never converted. Changing a price or a
          commission rate applies to future charges only - a consultation that
          has already settled keeps the rate recorded against it. Every change
          here is written to the audit log.
        </p>
      </header>

      <section className="rounded-[14px] border border-[#DDE6F0] bg-white p-5">
        <h2 className="text-[16px] font-semibold text-[#334155]">
          Professional commission
        </h2>
        <p className="mt-1 text-[13px] text-[#64748B]">
          What settlement actually charges. The plan cards below show these
          figures, so the two cannot disagree.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-[13px] font-medium text-[#64748B]">
            Starter %
            <input
              value={rateDraft.starter}
              onChange={(event) =>
                setRateDraft((prev) => ({
                  ...prev,
                  starter: event.target.value,
                }))
              }
              inputMode="decimal"
              className="mt-1 block w-28 rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
            />
          </label>
          <label className="text-[13px] font-medium text-[#64748B]">
            Pro %
            <input
              value={rateDraft.pro}
              onChange={(event) =>
                setRateDraft((prev) => ({ ...prev, pro: event.target.value }))
              }
              inputMode="decimal"
              className="mt-1 block w-28 rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
            />
          </label>
          <button
            type="button"
            onClick={saveRates}
            disabled={busy !== null}
            className="rounded-[10px] bg-[#1565C0] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "rates" ? "Saving..." : "Save rates"}
          </button>
          {rates ? (
            <span className="text-[13px] text-[#94A3B8]">
              Currently {rates.starterFeePercentage}% and{" "}
              {rates.proFeePercentage}%
            </span>
          ) : null}
        </div>
      </section>

      <section className="rounded-[14px] border border-[#DDE6F0] bg-white p-5">
        <h2 className="text-[16px] font-semibold text-[#334155]">
          Tax treatment
        </h2>
        <p className="mt-1 max-w-[720px] text-[13px] leading-5 text-[#64748B]">
          Prices are advertised inclusive of tax, so the tax is taken out of
          the advertised figure rather than added to it - the amount charged
          does not change. Nothing is charged until a rate is set and the
          country is marked as registered.
        </p>

        {tax && !tax.readyForLiveSales ? (
          <div className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] leading-5 text-[#92400E]">
            {tax.readiness
              .filter((entry) => !entry.settled)
              .map((entry) => (
                <p key={entry.country}>
                  <span className="font-semibold">{entry.country}</span>:{" "}
                  {entry.reason}
                </p>
              ))}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {Object.entries(taxDrafts).map(([country, draft]) => (
            <div
              key={country}
              className="flex flex-wrap items-end gap-3 rounded-[12px] border border-[#EEF2F7] p-4"
            >
              <span className="text-[15px] font-semibold text-[#334155]">
                {country}
              </span>

              <label className="text-[12px] font-medium text-[#94A3B8]">
                Rate %
                <input
                  value={draft.rate}
                  onChange={(event) =>
                    setTaxDrafts((prev) => ({
                      ...prev,
                      [country]: { ...prev[country], rate: event.target.value },
                    }))
                  }
                  inputMode="decimal"
                  className="mt-1 block w-24 rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
                />
              </label>

              <label className="text-[12px] font-medium text-[#94A3B8]">
                Called
                <input
                  value={draft.label}
                  onChange={(event) =>
                    setTaxDrafts((prev) => ({
                      ...prev,
                      [country]: {
                        ...prev[country],
                        label: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-28 rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
                />
              </label>

              <label className="flex items-center gap-2 pb-2 text-[13px] font-medium text-[#64748B]">
                <input
                  type="checkbox"
                  checked={draft.registered}
                  onChange={(event) =>
                    setTaxDrafts((prev) => ({
                      ...prev,
                      [country]: {
                        ...prev[country],
                        registered: event.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 accent-[#1565C0]"
                />
                Registered to charge it
              </label>

              <button
                type="button"
                onClick={() => saveTax(country)}
                disabled={busy !== null}
                className="rounded-[10px] bg-[#1565C0] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === `tax-${country}` ? "Saving..." : "Save"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-[#DDE6F0] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[#334155]">
            Maintenance
          </h2>
        </div>
        <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
          The sweep renews Paystack subscriptions, ends grace periods and
          closes expired plans. It is meant to run on a schedule - this button
          is for running it by hand.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              runTask(
                "seed",
                seedAdminSubscriptionPlans,
                "Any missing plans were created. Existing ones were left alone.",
              )
            }
            disabled={busy !== null}
            className="rounded-[10px] border border-[#1565C0] px-4 py-2.5 text-[14px] font-semibold text-[#1565C0] transition hover:bg-[#E3F2FD] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "seed" ? "Creating..." : "Create missing plans"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setBusy("pricing-report");
              try {
                setPricingReport(await normalizeAdminLegacyPricing(false));
              } catch (error) {
                toast.error(getApiErrorMessage(error));
              } finally {
                setBusy(null);
              }
            }}
            disabled={busy !== null}
            className="rounded-[10px] border border-[#DDE6F0] px-4 py-2.5 text-[14px] font-semibold text-[#64748B] transition hover:border-[#1565C0] hover:text-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "pricing-report"
              ? "Checking..."
              : "Check legacy pricing (dry run)"}
          </button>

          <button
            type="button"
            onClick={() =>
              runTask("sweep", runAdminSubscriptionSweep, "Sweep finished.")
            }
            disabled={busy !== null}
            className="rounded-[10px] border border-[#DDE6F0] px-4 py-2.5 text-[14px] font-semibold text-[#64748B] transition hover:border-[#1565C0] hover:text-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "sweep" ? "Running..." : "Run sweep now"}
          </button>
          <button
            type="button"
            onClick={() =>
              runTask(
                "reconcile",
                runAdminSubscriptionReconcile,
                "Reconciliation finished.",
              )
            }
            disabled={busy !== null}
            className="rounded-[10px] border border-[#DDE6F0] px-4 py-2.5 text-[14px] font-semibold text-[#64748B] transition hover:border-[#1565C0] hover:text-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "reconcile" ? "Checking..." : "Reconcile with providers"}
          </button>
        </div>
      </section>

      {pricingReport ? (
        <section className="rounded-[14px] border border-[#DDE6F0] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-[#334155]">
              Legacy pricing - dry run
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {pricingReport.plans.length > 0 &&
              pricingReport.plans.every((row) => row.charges.unchanged) ? (
                <button
                  type="button"
                  onClick={async () => {
                    setBusy("pricing-apply");
                    try {
                      const applied = await normalizeAdminLegacyPricing(true);
                      setPricingReport(applied);
                      toast.success(
                        `Recorded ${applied.affected} plan prices. No charge changed.`,
                      );
                      await load();
                    } catch (error) {
                      toast.error(getApiErrorMessage(error));
                    } finally {
                      setBusy(null);
                    }
                  }}
                  disabled={busy !== null || pricingReport.applied}
                  className="rounded-[10px] bg-[#1565C0] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pricingReport.applied
                    ? "Recorded"
                    : busy === "pricing-apply"
                      ? "Recording..."
                      : "Record these prices"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPricingReport(null)}
                className="text-[13px] font-semibold text-[#64748B] hover:text-[#334155]"
              >
                Dismiss
              </button>
            </div>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
            Nothing has been written. This shows what each plan charges now and
            what would be recorded. A plan whose charge would move is refused
            rather than written.
          </p>

          {pricingReport.plans.length === 0 ? (
            <p className="mt-4 text-[14px] text-[#94A3B8]">
              Nothing to normalise.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-[12px] border border-[#DDE6F0]">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#DDE6F0] text-[12px] font-semibold uppercase text-[#64748B]">
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">For</th>
                    <th className="px-4 py-3">Claims</th>
                    <th className="px-4 py-3">Charges now</th>
                    <th className="px-4 py-3">Would record</th>
                    <th className="px-4 py-3">Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingReport.plans.map((row) => (
                    <tr
                      key={row.planId}
                      className="border-b border-[#EEF2F7] text-[14px] text-[#334155] last:border-b-0"
                    >
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3 capitalize">
                        {row.targetUserType}
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8]">
                        {row.claimedCurrency ?? "-"}
                      </td>
                      <td className="px-4 py-3">{row.charges.before}</td>
                      <td className="px-4 py-3">{row.charges.after}</td>
                      <td className="px-4 py-3">
                        {row.charges.unchanged ? (
                          <span className="font-semibold text-[#0D8C24]">
                            Unchanged
                          </span>
                        ) : (
                          <span className="font-semibold text-[#B45309]">
                            Would move
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-[#334155]">Plans</h2>

        {plans.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#C9D7E6] bg-white p-6 text-[14px] text-[#94A3B8]">
            No plans exist yet. Use &quot;Create missing plans&quot; above to
            add them at the agreed prices.
          </div>
        ) : null}

        {plans.map((plan) => {
          const draft = drafts[plan.id];
          if (!draft) return null;
          const needsStripe = plan.provider !== "paystack";

          return (
            <article
              key={plan.id}
              className="rounded-[14px] border border-[#DDE6F0] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#334155]">
                    {plan.name}
                    <span className="ml-2 text-[13px] font-normal text-[#94A3B8]">
                      {plan.targetUserType} - {plan.country}
                    </span>
                  </h3>
                  <p className="mt-0.5 text-[13px] text-[#64748B]">
                    {minorToDisplay(plan.monthlyPriceMinor, plan.currency)}
                    {plan.monthlyPriceMinor !== null &&
                    plan.monthlyPriceMinor !== undefined
                      ? ` / month via ${plan.provider}`
                      : ""}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [plan.id]: {
                          ...prev[plan.id],
                          isActive: event.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 accent-[#1565C0]"
                  />
                  On sale
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-[12px] font-medium text-[#94A3B8]">
                  Price in {plan.currency === "NGN" ? "kobo" : "pence"}
                  <input
                    value={draft.monthlyPriceMinor}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [plan.id]: {
                          ...prev[plan.id],
                          monthlyPriceMinor: event.target.value,
                        },
                      }))
                    }
                    inputMode="numeric"
                    className="mt-1 block w-full rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
                  />
                </label>

                {needsStripe ? (
                  <label className="text-[12px] font-medium text-[#94A3B8]">
                    Stripe price ID
                    <input
                      value={draft.stripePriceId}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [plan.id]: {
                            ...prev[plan.id],
                            stripePriceId: event.target.value,
                          },
                        }))
                      }
                      placeholder="price_..."
                      className="mt-1 block w-full rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
                    />
                  </label>
                ) : (
                  <label className="text-[12px] font-medium text-[#94A3B8]">
                    Paystack plan code
                    <input
                      value={draft.paystackPlanCode}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [plan.id]: {
                            ...prev[plan.id],
                            paystackPlanCode: event.target.value,
                          },
                        }))
                      }
                      placeholder="PLN_..."
                      className="mt-1 block w-full rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
                    />
                  </label>
                )}

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => savePlan(plan)}
                    disabled={busy !== null}
                    className="w-full rounded-[10px] bg-[#1565C0] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === plan.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {pendingPriceChange?.planId === plan.id ? (
                <div className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4">
                  <p className="text-[14px] font-semibold text-[#92400E]">
                    This changes what subscribers are charged
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-[#92400E]">
                    From{" "}
                    <span className="font-semibold">
                      {pendingPriceChange.from}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold">
                      {pendingPriceChange.to}
                    </span>
                    . Anyone already subscribed pays the new amount at their
                    next renewal.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => savePlan(plan)}
                      disabled={busy !== null}
                      className="rounded-[10px] bg-[#B45309] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy === plan.id ? "Saving..." : "Yes, change the price"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingPriceChange(null)}
                      disabled={busy !== null}
                      className="rounded-[10px] border border-[#DDE6F0] bg-white px-4 py-2 text-[13px] font-semibold text-[#64748B] transition disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {plan.planCode === null ? (
                <p className="mt-3 text-[12px] text-[#B45309]">
                  This plan predates the current catalogue and has no plan
                  code. Use &quot;Create missing plans&quot; to bring it onto
                  the catalogue rather than editing it here.
                </p>
              ) : null}

              {needsStripe && !draft.stripePriceId.trim() ? (
                <p className="mt-3 text-[12px] text-[#B45309]">
                  No Stripe price is configured, so this plan cannot currently
                  be bought.
                </p>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
