"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createProfessionalPayoutMethod,
  createProfessionalStripePayoutMethod,
  formatApiMoney,
  getProfessionalWallet,
  getProfessionalStripeConnectStatus,
  getPaystackBanks,
  startProfessionalStripeConnectOnboarding,
  type ProfessionalPayoutMethod,
} from "@/services/professionalApi";

type AddBankFormState = {
  accountName: string;
  bankName: string;
  accountNumber: string;
  bankCode: string;
  sortCode: string;
  currency: string;
};

const emptyAddBankForm: AddBankFormState = {
  accountName: "",
  bankName: "",
  accountNumber: "",
  bankCode: "",
  sortCode: "",
  currency: "NGN",
};

const paystackCurrencies = new Set(["NGN"]);
export function ProfessionalReferralWithdrawPage() {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payoutMethods, setPayoutMethods] = useState<ProfessionalPayoutMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [addBankForm, setAddBankForm] = useState<AddBankFormState>(emptyAddBankForm);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState<Array<{ name: string; code: string; currency: string }>>([]);
  const [currency, setCurrency] = useState("NGN");
  const [nextPayoutAt, setNextPayoutAt] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<Awaited<ReturnType<typeof getProfessionalStripeConnectStatus>> | null>(null);
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);
  const isInternational = !paystackCurrencies.has(currency);

  useEffect(() => {
    let cancelled = false;

    async function loadWallet() {
      try {
        const [wallet, stripe] = await Promise.all([
          getProfessionalWallet(),
          getProfessionalStripeConnectStatus().catch(() => null),
        ]);
        if (cancelled) return;
        setAvailableBalance(wallet.summary.availableBalance);
        setCurrency(wallet.summary.currency);
        setNextPayoutAt(wallet.payoutSchedule.nextPayoutAt);
        setStripeStatus(stripe);
        setAddBankForm((current) => ({ ...current, currency: wallet.summary.currency }));
        const walletCurrency = wallet.summary.currency;
        const walletProvider = paystackCurrencies.has(walletCurrency) ? "paystack" : "stripe";
        let methods = wallet.payoutMethods.filter(
          (method) => method.currency === walletCurrency && method.provider === walletProvider,
        );
        if (
          stripe?.status === "active" &&
          !paystackCurrencies.has(walletCurrency) &&
          !methods.some((method) => method.provider === "stripe" && method.currency === walletCurrency)
        ) {
          try {
            const method = await createProfessionalStripePayoutMethod();
            methods = [method, ...methods];
          } catch {
            // Stripe Connect status remains the source of truth until the local method is created.
          }
        }
        setPayoutMethods(methods);
        setSelectedMethodId(
          methods.find((method) => method.defaultMethod)?.id ??
            methods[0]?.id ??
            "",
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load wallet");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadWallet();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!paystackCurrencies.has(currency)) {
      setBanks([]);
      return () => {
        cancelled = true;
      };
    }
    void getPaystackBanks(currency)
      .then((items) => {
        if (!cancelled) setBanks(items);
      })
      .catch((error) => {
        if (!cancelled) {
          setBanks([]);
          toast.error(error instanceof Error ? error.message : "Unable to load supported banks");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const handleAddBank = async () => {
    if (
      addBankForm.accountName.trim().length < 3 ||
      addBankForm.bankName.trim().length < 2 ||
      !addBankForm.bankCode ||
      addBankForm.accountNumber.trim().length < 6 ||
      (!paystackCurrencies.has(currency) && addBankForm.sortCode.trim().length < 3)
    ) {
      toast.error("Complete the bank details first");
      return;
    }

    setIsSavingBank(true);
    try {
      const method = await createProfessionalPayoutMethod({
        accountName: addBankForm.accountName.trim(),
        bankName: addBankForm.bankName.trim(),
        accountNumber: addBankForm.accountNumber.trim(),
        bankCode: addBankForm.bankCode || undefined,
        sortCode: addBankForm.sortCode.trim() || undefined,
        currency: addBankForm.currency,
        defaultMethod: payoutMethods.length === 0,
      });
      setPayoutMethods((current) => [method, ...current]);
      setSelectedMethodId(method.id);
      setAddBankForm({ ...emptyAddBankForm, currency });
      toast.success("Bank account verified and added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add bank account");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleStripeSetup = async () => {
    setIsSettingUpStripe(true);
    try {
      const base = window.location.origin;
      const result = await startProfessionalStripeConnectOnboarding({
        returnUrl: `${base}/professional-platform/earnings/withdraw?stripe_connect=complete`,
        refreshUrl: `${base}/professional-platform/earnings/withdraw?stripe_connect=refresh`,
      });
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start Stripe payout setup");
      setIsSettingUpStripe(false);
    }
  };

  return (
    <div className="mt-4 pb-10">
      <div className="mx-auto max-w-[840px] rounded-[8px] bg-[#F8FAFC] px-4 py-6 shadow-[0_18px_42px_rgba(148,163,184,0.12)] sm:px-7 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold leading-tight text-[#334155]">
              Withdraw Funds
            </h1>
            <p className="mt-1.5 max-w-[560px] text-[14px] leading-5 text-[#64748B]">
              Connect your payout account and receive eligible earnings in the weekly settlement cycle.
            </p>
          </div>
          <Link
            href="/professional-platform/earnings"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[8px] border border-[#94A3B8] px-4 text-[13px] font-medium text-[#334155] transition hover:border-[#1565C0] hover:text-[#1565C0]"
          >
            Back to earnings
          </Link>
        </header>

        <div className="mt-5 rounded-[8px] bg-[#E3F2FD] px-4 py-5 text-center sm:px-6">
          <p className="text-[14px] font-medium text-[#1565C0]">
            Available for next payout
          </p>
          <p className="mt-2 break-words text-[30px] font-semibold leading-none text-[#334155] sm:text-[34px]">
            {isLoading ? "Loading..." : formatApiMoney(availableBalance, currency)}
          </p>
        </div>

        <section id="payout-method" className="scroll-mt-24 mt-5 rounded-[8px] border border-[#E2E8F0] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-[17px] font-semibold text-[#334155]">Payout method</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
              {isInternational
                ? "Stripe securely collects and manages your identity and bank details for international payouts."
                : "Add and select the verified Nigerian bank account that should receive your payout."}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {payoutMethods.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-[#94A3B8] px-4 py-5 text-[14px] text-[#64748B]">
                No payout method has been added yet.
              </div>
            ) : payoutMethods.map((method) => {
              const active = method.id === selectedMethodId;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-[6px] border bg-[#F8FAFC] px-4 py-3 text-left transition ${
                    active ? "border-[#1565C0]" : "border-[#E2E8F0] hover:border-[#bfdcff]"
                  }`}
                >
                  <span>
                    <span className="block text-[16px] tracking-[-0.07em] text-[#334155]">
                      {method.accountName}
                    </span>
                    <span className="mt-1 block text-[13px] text-[#64748B]">
                      {method.provider === "stripe"
                        ? `Stripe connected account - ID ending ${method.accountNumberLast4}`
                        : `${method.bankName} - ****${method.accountNumberLast4}`}
                    </span>
                  </span>
                  {active ? <span className="text-[#1565C0]">Selected</span> : null}
                </button>
              );
            })}
          </div>

          {!isInternational ? <>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              value={addBankForm.accountName}
              onChange={(event) => setAddBankForm((current) => ({ ...current, accountName: event.target.value }))}
              placeholder="Account name"
              className="h-11 rounded-[8px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
            />
            <select
              value={addBankForm.bankCode}
              onChange={(event) => {
                const bank = banks.find((item) => item.code === event.target.value);
                setAddBankForm((current) => ({
                  ...current,
                  bankCode: bank?.code ?? "",
                  bankName: bank?.name ?? "",
                }));
              }}
              className="h-11 cursor-pointer rounded-[8px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
            >
              <option value="">Select bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
            <input
              value={addBankForm.accountNumber}
              onChange={(event) => setAddBankForm((current) => ({ ...current, accountNumber: event.target.value.replace(/[^\d]/g, "") }))}
              placeholder="Account number"
              inputMode="numeric"
              className="h-11 rounded-[8px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
            />
            <input
              value={addBankForm.sortCode}
              onChange={(event) => setAddBankForm((current) => ({ ...current, sortCode: event.target.value.replace(/[^a-zA-Z0-9 -]/g, "") }))}
              placeholder={paystackCurrencies.has(currency) ? "Sort code (optional)" : "Sort code"}
              autoComplete="off"
              className="h-11 rounded-[8px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
            />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#64748B]">
            Nigerian payouts use Paystack bank verification. Paystack is not used for international currencies.
          </p>
          <button
            type="button"
            onClick={handleAddBank}
            disabled={isSavingBank}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,#1E88E5_0%,#114B7F_72.12%)] px-5 text-[14px] font-medium text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingBank ? "Saving..." : "Add bank"}
          </button>
          </> : (
            <div className="mt-5 rounded-[8px] border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-4">
              {stripeStatus?.status === "active" ? (
                <>
                  <p className="text-[15px] font-semibold text-[#166534]">Stripe payout account connected</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
                    Your Stripe account is eligible to receive international payouts. Swift HELP does not store your bank details.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-[#334155]">Stripe payout setup required</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
                    Complete Stripe-hosted onboarding to verify your identity and add the bank account for {currency} settlement.
                  </p>
                  <button
                    type="button"
                    onClick={handleStripeSetup}
                    disabled={isSettingUpStripe}
                    className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,#1E88E5_0%,#114B7F_72.12%)] px-5 text-[14px] font-medium text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSettingUpStripe ? "Opening Stripe..." : "Set up Stripe payout account"}
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        <section id="withdrawal" className="scroll-mt-24 mt-4 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 sm:px-5">
          <h2 className="text-[17px] font-semibold text-[#334155]">Weekly settlement</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
            Eligible earnings are settled automatically once each week. The next payout window is:
          </p>
          <p className="mt-3 text-[18px] font-semibold text-[#1565C0]">
            {nextPayoutAt
              ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(nextPayoutAt))
              : "Loading..."}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">Payouts are sent only after the connected account or Nigerian bank method is verified.</p>
        </section>
      </div>
    </div>
  );
}
