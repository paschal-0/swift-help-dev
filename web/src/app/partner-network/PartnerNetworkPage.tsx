"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { containerClass } from "../landing/classes";
import { getProfile, platformPathForRole, type BackendRole } from "@/services/authApi";

/**
 * The Partner Network, explained to the people who might join it.
 *
 * It used to be described only on the pricing page, in the language of a
 * pitch deck - "investor-friendly growth", "platform placement", "fraud
 * scoring". This says what somebody taking part actually does, what they have
 * to be, and what they get.
 *
 * Nothing here quotes a reward amount. Rates are set per region and per tier
 * and an administrator can change them, so the amounts belong in the
 * Referrals section of an account, where they are read from the live
 * configuration, not written into a marketing page.
 */

const steps = [
  {
    title: "Share your code",
    body: "Every Swift HELP account has a referral code and a link. You will find both in the Referrals section of your dashboard, ready to send or post.",
  },
  {
    title: "They join and are verified",
    body: "Your reward is earned when the person or organization you invited completes signup and passes verification. A referral that never completes earns nothing.",
  },
  {
    title: "Your reward is credited",
    body: "The reward appears against that referral in your Referrals list, in your own currency, with the date and the person it came from.",
  },
  {
    title: "Withdraw when you want",
    body: "Referral earnings sit in a withdrawable balance. You choose when to withdraw, to the same payout details your account already uses.",
  },
];

const whoCanJoin = [
  {
    title: "Patients",
    body: "Anyone with a Swift HELP patient account. Invite friends, family, professionals you rate, or a practice you would like to see on Swift HELP.",
  },
  {
    title: "Healthcare professionals",
    body: "Verified professionals can invite colleagues and the organizations they work with, alongside taking bookings as usual.",
  },
  {
    title: "Organizations",
    body: "Care organizations can invite the professionals they work with and other facilities in their group.",
  },
];

const rewardFacts = [
  {
    title: "Three tiers",
    body: "Everyone starts at the first tier. Reaching the number of completed referrals shown in your dashboard unlocks the next one, and the reward for each new referral rises with it.",
  },
  {
    title: "Different referrals, different rewards",
    body: "Inviting a patient, a professional and an organization are rewarded at separate rates, because they take different amounts of effort.",
  },
  {
    title: "Priced for where you are",
    body: "Rewards are set per region and shown in your own currency, so a partner in Nigeria is not quoted a figure meant for the United Kingdom.",
  },
  {
    title: "Checked before they are paid",
    body: "Referrals are checked for duplicate and self-referral before a reward is credited, so the people doing the real work are not competing with made-up signups.",
  },
];

const rules = [
  "Invite people who would genuinely benefit. Referring yourself, or creating accounts to refer, earns nothing and can close your partner access.",
  "Describe Swift HELP accurately. Do not promise clinical outcomes, and do not present Swift HELP as a replacement for emergency care.",
  "Do not send unsolicited bulk messages, and follow the rules of any platform you post on.",
  "A reward is earned once per completed, verified referral. A referral that is reversed or refunded can be reversed too.",
  "Reward rates can change. The rate shown in your dashboard when a referral completes is the rate it earns.",
];

export function PartnerNetworkPage() {
  const [role, setRole] = useState<BackendRole | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled) return;
        const value =
          profile && typeof profile === "object" && "role" in profile
            ? (profile as { role?: unknown }).role
            : null;
        setRole(typeof value === "string" ? (value as BackendRole) : null);
      })
      .catch(() => {
        // Signed out. The public invitation below is the right one.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryHref = role
    ? `${platformPathForRole(role)}/referrals`
    : "/get-started/create-account?role=patient";
  const primaryLabel = role ? "Open your Referrals dashboard" : "Create an account to start";

  return (
    <main className="bg-white text-slate-900">
      <section className="bg-[#e3f2fd] pb-[90px] pt-[35px] max-[767px]:pb-14 max-[767px]:pt-5">
        <div className={containerClass}>
          <div className="grid items-center gap-10 px-6 max-[767px]:px-2 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0">
              <p className="m-0 text-[24px] font-light leading-7 tracking-[-0.05em] text-[#1e1e1e] max-[767px]:text-[16px] max-[767px]:leading-5">
                Swift HELP Partner Network
              </p>
              <h1 className="m-0 mt-5 max-w-[830px] text-[56px] font-semibold leading-[60px] tracking-[-0.05em] text-[#1e1e1e] max-[767px]:mt-3 max-[767px]:text-[34px] max-[767px]:leading-9">
                Help someone find care. Earn something for it.
              </h1>
              <p className="mt-6 max-w-[760px] text-[24px] font-light leading-8 tracking-[-0.05em] text-[#1e1e1e] max-[767px]:mt-4 max-[767px]:text-[16px] max-[767px]:leading-6">
                Invite the people and organizations you think Swift HELP would
                help. When they join and are verified, you are rewarded - and
                you can see every referral, every reward and your balance in
                your own account.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[45px] bg-[linear-gradient(180deg,#1565c0_0%,#0d3f6e_72.12%)] px-6 text-[17px] font-medium tracking-[-0.05em] text-white transition hover:brightness-110"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[45px] border border-[#1565c0] bg-white px-6 text-[17px] font-medium tracking-[-0.05em] text-[#1565c0] transition hover:bg-white/70"
                >
                  See Swift HELP pricing
                </Link>
              </div>
            </div>

            <aside className="rounded-[8px] border border-white/80 bg-white p-6 shadow-[0_18px_55px_rgba(30,136,229,0.13)]">
              <p className="text-[18px] font-semibold leading-6 tracking-[-0.05em] text-[#1565c0]">
                At a glance
              </p>
              <div className="mt-5 space-y-4">
                {[
                  ["Free to join", "No application, no fee, no minimum."],
                  ["Open to every account", "Patients, professionals and organizations alike."],
                  ["Paid on verified signups", "A referral earns when it completes, not when it is sent."],
                  ["Withdraw on your terms", "Your balance is yours to take out when you choose."],
                ].map(([label, text]) => (
                  <div key={label} className="border-l-4 border-[#1e88e5] pl-4">
                    <p className="font-semibold tracking-[-0.05em] text-slate-950">{label}</p>
                    <p className="mt-1 text-[14px] leading-5 tracking-[-0.05em] text-slate-700">{text}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-[72px] max-[767px]:py-12">
        <div className={containerClass}>
          <div className="px-6 max-[767px]:px-2">
            <h2 className="m-0 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="flex h-full min-w-0 flex-col rounded-[8px] border border-[#dbeafe] bg-white p-6 shadow-[0_18px_55px_rgba(30,136,229,0.10)]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e3f2fd] text-[15px] font-semibold text-[#1565c0]">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-[20px] font-semibold leading-7 tracking-[-0.05em] text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[15px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4fbff] py-[72px] max-[767px]:py-12">
        <div className={containerClass}>
          <div className="px-6 max-[767px]:px-2">
            <h2 className="m-0 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
              Who can take part
            </h2>
            <p className="mt-3 max-w-[760px] text-[18px] font-light leading-7 tracking-[-0.05em] text-slate-700">
              Anybody with a Swift HELP account, in any country Swift HELP
              operates in. You need a verified account and payout details to
                withdraw what you earn.
            </p>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {whoCanJoin.map((item) => (
                <article
                  key={item.title}
                  className="flex h-full min-w-0 flex-col rounded-[8px] border border-[#dbeafe] bg-white p-6 shadow-sm"
                >
                  <h3 className="text-[22px] font-semibold leading-7 tracking-[-0.05em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-[72px] max-[767px]:py-12">
        <div className={containerClass}>
          <div className="px-6 max-[767px]:px-2">
            <h2 className="m-0 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
              What you earn
            </h2>
            <p className="mt-3 max-w-[760px] text-[18px] font-light leading-7 tracking-[-0.05em] text-slate-700">
              Reward amounts are set for your region and your tier, and are
              shown in your Referrals dashboard in your own currency. They are
              read from the live settings rather than printed here, so what you
              see is what you will be paid.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {rewardFacts.map((item) => (
                <article
                  key={item.title}
                  className="flex h-full min-w-0 flex-col rounded-[8px] border border-[#dbeafe] bg-white p-6 shadow-sm"
                >
                  <h3 className="text-[22px] font-semibold leading-7 tracking-[-0.05em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e3f2fd] py-[72px] max-[767px]:py-12">
        <div className={containerClass}>
          <div className="px-6 max-[767px]:px-2">
            <h2 className="m-0 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
              The rules, in plain terms
            </h2>
            <div className="mt-8 grid gap-4">
              {rules.map((rule) => (
                <div
                  key={rule}
                  className="flex min-w-0 items-start gap-3 rounded-[8px] bg-white p-5 shadow-[0_12px_35px_rgba(30,136,229,0.08)]"
                >
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e3f2fd] text-[13px] font-semibold text-[#1565c0]">
                    +
                  </span>
                  <p className="min-w-0 text-[16px] font-light leading-6 tracking-[-0.05em] text-slate-800">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href={primaryHref}
                className="inline-flex min-h-[54px] items-center justify-center rounded-[45px] bg-[linear-gradient(180deg,#1565c0_0%,#0d3f6e_72.12%)] px-6 text-[17px] font-medium tracking-[-0.05em] text-white transition hover:brightness-110"
              >
                {primaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
