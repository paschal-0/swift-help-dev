"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { containerClass } from "../landing/classes";
import { getProfile, platformPathForRole, type BackendRole } from "@/services/authApi";
import { getPublicPricing, type PublicPricing, type PublicPricingPlan } from "@/services/pricingApi";
import {
  getProfessionalSubscription,
  type ProfessionalSubscriptionOverview,
} from "@/services/professionalApi";

type Audience = "patients" | "professionals" | "organizations";

type PricingPlan = {
  /** Matches the plan to the row the backend prices, where there is one. */
  planCode?: string;
  name: string;
  /** Used only until the real price arrives, and only where it is right. */
  price: string;
  /** Countries this written price is true for. Empty means every country. */
  priceCountries?: string[];
  /** Shown instead of a price where no price is published for the country. */
  priceUnavailable?: string;
  description: string;
  features: string[];
  highlights?: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const audienceLabels: Record<Audience, string> = {
  patients: "Patients",
  professionals: "Professionals",
  organizations: "Organizations",
};

const SUBSCRIPTION_SETTINGS = "/professional-platform/settings?tab=subscription";

/**
 * Where each role manages its own plan. A signed-in visitor reading the plans
 * for their own audience belongs here rather than back at registration.
 */
const PLAN_SETTINGS: Partial<Record<BackendRole, string>> = {
  professional: SUBSCRIPTION_SETTINGS,
  organization: "/organisation-platform/settings?tab=Subscription",
  patient: "/patient-platform/settings?tab=billing",
};

/** The audience whose plans a role actually buys. */
const AUDIENCE_FOR_ROLE: Partial<Record<BackendRole, Audience>> = {
  professional: "professionals",
  organization: "organizations",
  patient: "patients",
};

/**
 * The written page, used where the backend publishes no price for a plan in
 * the country being viewed.
 *
 * Prices here are a last resort, not the source of truth: anything the
 * backend prices overwrites them. Each written price records the countries it
 * is actually true for, because quoting a pound figure to a visitor who would
 * be charged in naira is the fault this replaces.
 */
const pricingPlans: Record<Audience, PricingPlan[]> = {
  patients: [
    {
      name: "Free",
      price: "Free",
      description: "Core access for people who want basic digital healthcare support.",
      features: [
        "Basic AI symptom checker",
        "Browse healthcare professionals",
        "View professional availability",
        "Secure patient account",
      ],
      cta: "Get started free",
      href: "/get-started/create-account?role=patient",
    },
    {
      name: "Pay as you go",
      price: "No subscription",
      description: "Book care only when you need it, at a price you see before you pay.",
      features: [
        "The professional sets their consultation price",
        "The specialist sets their specialist price",
        "The provider sets their home care price",
        "Unused consultation time is refunded",
      ],
      highlights: [
        "Pay only when you need care",
        "The full price is shown before checkout",
      ],
      cta: "Book a consultation",
      href: "/patient-platform/appointments/book",
      featured: true,
    },
    // The Premium patient plan is not on sale. It was advertised here at a
    // price that existed in no plan on the system, and none of the benefits
    // it described - higher AI allowances, priority booking, a consultation
    // discount - was gated on holding it. It returns when those are built and
    // enforced by entitlement, and priced for each country.
  ],
  professionals: [
    {
      planCode: "professional_starter",
      name: "Starter",
      price: "Free",
      description: "A simple way for verified healthcare professionals to join and earn.",
      features: [
        "Professional profile listed in patient search",
        "Booking, scheduling and secure payouts",
        "Consultation earnings and transaction history",
      ],
      cta: "Join as a Professional",
      href: "/get-started/create-account?role=professional",
    },
    {
      planCode: "professional_pro",
      name: "Pro",
      price: "£29/month",
      priceCountries: ["GB"],
      priceUnavailable: "See your plan options",
      description: "A lower commission and higher placement for professionals seeing regular bookings.",
      features: [
        "Listed above Starter professionals in patient search, shown as promoted",
        "Repeat patient, cancellation rate and busiest times analytics",
        "Earnings trends over the last six months",
        "Everything in Starter",
      ],
      cta: "Join and start on Pro",
      href: "/get-started/create-account?role=professional&plan=pro",
      featured: true,
    },
  ],
  organizations: [
    {
      planCode: "organization_starter",
      name: "Starter",
      price: "£99/month",
      priceCountries: ["GB"],
      priceUnavailable: "See your plan options",
      description: "For teams starting with shift posting and basic professional matching.",
      features: [
        "Post shifts",
        "Access professional pool",
        "Basic matching",
        "Up to 3 admin users",
      ],
      cta: "Start hiring",
      href: "/get-started/create-account?role=organisation&plan=starter",
    },
    {
      planCode: "organization_growth",
      name: "Growth",
      price: "£299/month",
      priceCountries: ["GB"],
      priceUnavailable: "See your plan options",
      description: "For active care organizations that need stronger staffing operations.",
      features: [
        "Unlimited shift posting",
        "Priority staff matching",
        "Workforce dashboard",
        "Basic analytics",
        "AI operational intelligence assistant",
        "Up to 10 admin users",
      ],
      cta: "Upgrade to Growth",
      href: "/get-started/create-account?role=organisation&plan=growth",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom pricing",
      description: "For multi-location healthcare groups with advanced integration needs.",
      features: [
        "Multi-location support",
        "Advanced analytics",
        "AI workflow support",
        "API integrations",
        "Dedicated account manager",
        "Custom workflows",
        "Admin seats sized to need",
      ],
      // The original specification quotes GBP 500 to GBP 5,000 for setup. It
      // is written as a quote rather than a range because there is no
      // equivalent figure for Nigeria, and a pound range on a naira page is
      // the fault this page was just corrected for.
      highlights: ["Setup and onboarding quoted for your organization"],
      cta: "Book a demo",
      href: "/#contact",
    },
  ],
};

const trustItems = [
  "Secure payments",
  "Verified professionals",
  "Built for healthcare compliance",
  "Scalable for individuals and organizations",
];

const faqs = [
  {
    question: "What does Swift HELP charge for?",
    answer:
      "Two things, both shown before you pay: a monthly plan for professionals and organizations who want one, and a commission on the final chargeable amount of each consultation. Patients pay only for the care they book.",
  },
  {
    question: "Do patients need a subscription?",
    answer:
      "No, and there is no patient plan to buy at the moment. Patients keep a free account and pay for each consultation, at the price shown before checkout.",
  },
  {
    question: "How are professionals paid?",
    answer:
      "Payouts are released after the consultation is confirmed, less the commission for the plan you are on. Your transaction history shows the original payment, the chargeable amount, any unused-time refund, the commission and your net earning, line by line.",
  },
  {
    question: "What happens to time we do not use?",
    answer:
      "Where unused-time refunds apply, the patient is charged only for the time used and the rest is refunded. Commission is worked out on that final chargeable amount, not on the original booking.",
  },
  {
    question: "Are there hidden fees?",
    answer:
      "No. Consultation prices, plan prices and commission rates are shown in full before checkout, and every settled consultation keeps the rate it was charged at.",
  },
];

function Mark() {
  return (
    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e3f2fd] text-[13px] font-semibold text-[#1565c0]">
      +
    </span>
  );
}

/**
 * The country whose prices this visitor should see.
 *
 * The public site is country-prefixed - /uk/pricing, /ng/pricing - and the
 * prefix is rewritten away before the route renders, so it is read from the
 * address bar rather than from the router. `uk` in a path is `GB` in the data.
 */
function readCountry(): string {
  if (typeof window === "undefined") return "GB";
  const segment = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  if (/^[a-z]{2}$/i.test(segment)) {
    return segment.toUpperCase() === "UK" ? "GB" : segment.toUpperCase();
  }
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("swifthelp_country="))
    ?.split("=")[1];
  if (!cookie) return "GB";
  return cookie.toUpperCase() === "UK" ? "GB" : cookie.toUpperCase();
}

/** A price in the currency it will actually be charged in. */
function formatMonthlyPrice(minor: number, currency: string) {
  if (minor <= 0) return "Free";
  const major = minor / 100;
  try {
    const formatted = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
    return `${formatted}/month`;
  } catch {
    return `${currency} ${major}/month`;
  }
}

type AudienceState = {
  plans: PricingPlan[];
  /** True when these prices came from the backend rather than the page. */
  priced: boolean;
};

/**
 * The written plan, with whatever the backend actually prices laid over it.
 *
 * Only the price, the commission line and the feature list are taken from the
 * backend; the marketing description and the call to action stay here.
 */
function applyPricing(
  plans: PricingPlan[],
  priced: PublicPricingPlan[],
  country: string,
): AudienceState {
  if (!priced.length) {
    return {
      plans: plans.map((plan) => withCountryPrice(plan, country)),
      priced: false,
    };
  }

  const byCode = new Map(
    priced.filter((plan) => plan.planCode).map((plan) => [plan.planCode, plan]),
  );

  return {
    plans: plans.map((plan) => {
      const match = plan.planCode ? byCode.get(plan.planCode) : undefined;
      if (!match) return withCountryPrice(plan, country);
      return {
        ...plan,
        price: formatMonthlyPrice(match.monthlyPriceMinor, match.currency),
        priceCountries: undefined,
        description: match.description ?? plan.description,
        features: match.features.length ? match.features : plan.features,
      };
    }),
    priced: true,
  };
}

/**
 * A written price is shown only in the countries it is true for. Elsewhere
 * the card says so rather than quoting a figure nobody would be charged.
 */
function withCountryPrice(plan: PricingPlan, country: string): PricingPlan {
  if (!plan.priceCountries?.length) return plan;
  if (plan.priceCountries.includes(country)) return plan;
  return { ...plan, price: plan.priceUnavailable ?? "Shown at checkout" };
}

function defaultAudienceForRole(role: BackendRole | null): Audience {
  if (role === "professional") return "professionals";
  if (role === "organization") return "organizations";
  return "patients";
}

type Viewer = {
  role: BackendRole | null;
  subscription: ProfessionalSubscriptionOverview | null;
};

/**
 * Where a plan's button should lead for whoever is reading the page, and what
 * it should say.
 *
 * A professional already paying for Pro was being shown "Join as a
 * Professional" and "Upgrade to Pro" - an invitation to register a second
 * time and to buy a plan they already hold. What someone is offered here now
 * depends on what they already have.
 */
function resolvePlanCta(
  plan: PricingPlan,
  audience: Audience,
  viewer: Viewer,
): PricingPlan {
  const { role, subscription } = viewer;
  if (!role) return plan;

  if (audience === "professionals" && role === "professional") {
    const isPro = subscription?.isPro ?? false;
    const ending = subscription?.cancelAtPeriodEnd ?? false;

    if (plan.planCode === "professional_pro") {
      if (isPro && ending) {
        return { ...plan, cta: "Resume your Pro plan", href: SUBSCRIPTION_SETTINGS };
      }
      if (isPro) {
        return { ...plan, cta: "Current Plan - manage subscription", href: SUBSCRIPTION_SETTINGS };
      }
      return { ...plan, cta: "Upgrade to Pro", href: SUBSCRIPTION_SETTINGS };
    }

    if (plan.planCode === "professional_starter") {
      if (isPro && ending) {
        return { ...plan, cta: "Your plan returns to Starter", href: SUBSCRIPTION_SETTINGS };
      }
      if (isPro) {
        return { ...plan, cta: "Switch to Starter", href: SUBSCRIPTION_SETTINGS };
      }
      return { ...plan, cta: "Current Plan", href: SUBSCRIPTION_SETTINGS };
    }
  }

  // Their own audience: send them to the place they manage that plan.
  if (AUDIENCE_FOR_ROLE[role] === audience && PLAN_SETTINGS[role]) {
    return { ...plan, cta: "Manage your plan", href: PLAN_SETTINGS[role] as string };
  }

  // Someone else's audience. One account holds one role, so a signed-in
  // patient reading the professional plans is not invited to register as a
  // professional - they are sent back to their own dashboard.
  return { ...plan, cta: "Go to your dashboard", href: platformPathForRole(role) };
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <article
      className={`flex h-full min-w-0 flex-col rounded-[8px] border bg-white p-6 shadow-[0_18px_55px_rgba(30,136,229,0.10)] transition duration-300 hover:-translate-y-1 max-[767px]:p-5 ${
        plan.featured ? "border-[#1565c0] ring-2 ring-[#d5ecff]" : "border-[#dbeafe]"
      }`}
    >
      {plan.featured ? (
        <span className="mb-5 w-fit rounded-full bg-[#e3f2fd] px-4 py-2 text-[12px] font-semibold uppercase text-[#1565c0]">
          Most relevant
        </span>
      ) : null}
      <h2 className="m-0 text-[24px] font-semibold leading-8 tracking-[-0.05em] text-slate-950 max-[767px]:text-[20px]">
        {plan.name}
      </h2>
      <p className="mt-3 text-[34px] font-semibold leading-10 tracking-[-0.05em] text-[#1565c0] max-[767px]:text-[28px]">
        {plan.price}
      </p>
      <p className="mt-4 min-h-[72px] text-[16px] font-light leading-6 tracking-[-0.05em] text-slate-700 max-[767px]:min-h-0 max-[767px]:text-[14px]">
        {plan.description}
      </p>

      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <p key={feature} className="flex min-w-0 items-start gap-3 text-[15px] leading-6 tracking-[-0.05em] text-slate-800">
            <Mark />
            <span className="min-w-0 break-words">{feature}</span>
          </p>
        ))}
      </div>

      {plan.highlights?.length ? (
        <div className="mt-5 space-y-2 rounded-[8px] bg-[#f4fbff] p-4">
          {plan.highlights.map((highlight) => (
            <p key={highlight} className="text-[14px] font-medium leading-5 tracking-[-0.05em] text-slate-700">
              {highlight}
            </p>
          ))}
        </div>
      ) : null}

      <Link
        href={plan.href}
        className={`mt-auto inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[45px] px-5 py-3 text-center text-[18px] font-medium tracking-[-0.05em] transition max-[767px]:text-[16px] ${
          plan.featured
            ? // White on a darker blue, so the label is readable on a phone
              // in daylight. The old pale-blue-on-light-blue was below the
              // contrast floor for text this size.
              "bg-[linear-gradient(180deg,#1565c0_0%,#0d3f6e_72.12%)] text-white hover:brightness-110"
            : "border border-[#1565c0] bg-white text-[#1565c0] hover:bg-[#e3f2fd]"
        }`}
      >
        <span className="min-w-0">{plan.cta}</span>
        <span aria-hidden="true">-&gt;</span>
      </Link>
    </article>
  );
}

/** The country is a property of the address bar, not of React state. */
const subscribeToNothing = () => () => {};

export function PricingPage() {
  /** Set once the visitor picks a tab, so their choice is not overridden. */
  const [chosenAudience, setChosenAudience] = useState<Audience | null>(null);
  const [viewer, setViewer] = useState<Viewer>({ role: null, subscription: null });
  const [pricing, setPricing] = useState<PublicPricing | null>(null);

  // Read through a store rather than set in an effect, so the server and the
  // first client render agree and nothing cascades.
  const country = useSyncExternalStore(
    subscribeToNothing,
    readCountry,
    () => "GB",
  );

  // Open on the plans that belong to whoever is reading, rather than always
  // on the patient ones - and stay wherever they then click.
  const audience: Audience =
    chosenAudience ?? defaultAudienceForRole(viewer.role);

  useEffect(() => {
    let cancelled = false;
    getPublicPricing(country)
      .then((next) => {
        if (!cancelled) setPricing(next);
      })
      .catch(() => {
        // The written prices stand in. They say which countries they apply to.
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  // Someone already signed in should be shown what they already have, and
  // sent to the plan they can actually act on.
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(async (profile) => {
        if (cancelled) return;
        const value =
          profile && typeof profile === "object" && "role" in profile
            ? (profile as { role?: unknown }).role
            : null;
        const role = typeof value === "string" ? (value as BackendRole) : null;
        if (role !== "professional") {
          setViewer({ role, subscription: null });
          return;
        }
        // Their actual plan, so the page cannot offer Pro to somebody paying
        // for it. A failure here leaves the public wording, which is safe.
        const subscription = await getProfessionalSubscription(country).catch(
          () => null,
        );
        if (!cancelled) setViewer({ role, subscription });
      })
      .catch(() => {
        // Signed out. The public call to action is correct as written.
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const { plans, priced } = useMemo(() => {
    const written = pricingPlans[audience];
    const fromBackend = pricing ? pricing[audience] : [];
    const state = applyPricing(written, fromBackend, country);
    return {
      plans: state.plans.map((plan) => resolvePlanCta(plan, audience, viewer)),
      priced: state.priced,
    };
  }, [audience, pricing, country, viewer]);

  const commission = pricing?.commission ?? null;
  const subscription = viewer.subscription;
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="bg-white text-slate-900">
      <section className="bg-[#e3f2fd] pb-[90px] pt-[35px] max-[767px]:pb-14 max-[767px]:pt-5">
        <div className={containerClass}>
          <div className="grid items-center gap-10 px-6 max-[767px]:px-2 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0">
              <p className="m-0 text-[24px] font-light leading-7 tracking-[-0.05em] text-[#1e1e1e] max-[767px]:text-[16px] max-[767px]:leading-5">
                Swift HELP Pricing
              </p>
              <h1 className="m-0 mt-5 max-w-[830px] text-[56px] font-semibold leading-[60px] tracking-[-0.05em] text-[#1e1e1e] max-[767px]:mt-3 max-[767px]:text-[34px] max-[767px]:leading-9">
                Simple, Transparent Pricing for Modern Healthcare Access
              </h1>
              <p className="mt-6 max-w-[760px] text-[24px] font-light leading-8 tracking-[-0.05em] text-[#1e1e1e] max-[767px]:mt-4 max-[767px]:text-[16px] max-[767px]:leading-6">
                Whether you are a patient, healthcare professional, or organization,
                Swift HELP scales with your needs.
              </p>
              {viewer.role ? (
                <Link
                  href={platformPathForRole(viewer.role)}
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-[45px] border border-[#1565c0] bg-white px-6 text-[16px] font-medium tracking-[-0.05em] text-[#1565c0] transition hover:bg-white/70"
                >
                  Back to your dashboard
                </Link>
              ) : null}
            </div>

            <aside className="rounded-[8px] border border-white/80 bg-white p-6 shadow-[0_18px_55px_rgba(30,136,229,0.13)]">
              <p className="text-[18px] font-semibold leading-6 tracking-[-0.05em] text-[#1565c0]">
                What you pay for
              </p>
              <div className="mt-5 space-y-4">
                {[
                  [
                    "Care when you need it",
                    "Book and pay per consultation, with the price shown before checkout and unused time refunded.",
                  ],
                  [
                    "Optional monthly plans",
                    "Patients, professionals and organizations can choose a plan for more support and lower costs. Nobody has to.",
                  ],
                  [
                    "A clear commission",
                    commission
                      ? `Professionals keep the consultation fee less commission: ${commission.starterPercentage}% on Starter, ${commission.proPercentage}% on Pro, charged on the final chargeable amount.`
                      : "Professionals keep the consultation fee less a commission charged on the final chargeable amount, never on time that was refunded.",
                  ],
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
          <div className="flex items-end justify-between gap-6 px-6 max-[900px]:flex-col max-[900px]:items-start max-[767px]:px-2">
            <div>
              <h2 className="m-0 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
                Choose your access
              </h2>
              <p className="mt-3 max-w-[560px] text-[21px] font-light leading-7 tracking-[-0.05em] text-[#1e1e1e] max-[767px]:text-[15px] max-[767px]:leading-6">
                Use the toggle to keep patient, professional, and organization
                pricing clear.
              </p>
            </div>
            <div className="grid w-full max-w-[560px] grid-cols-3 rounded-[45px] border border-[#dbeafe] bg-white p-1 shadow-[0_10px_35px_rgba(30,136,229,0.10)] max-[767px]:max-w-none">
              {(Object.keys(audienceLabels) as Audience[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChosenAudience(key)}
                  aria-pressed={audience === key}
                  className={`min-h-[52px] rounded-[45px] px-4 text-[17px] font-normal tracking-[-0.05em] transition max-[767px]:min-h-[44px] max-[767px]:px-2 max-[767px]:text-[13px] ${
                    audience === key
                      ? "bg-[#334155] text-white shadow-sm"
                      : "text-slate-700 hover:bg-[#e3f2fd]"
                  }`}
                >
                  {audienceLabels[key]}
                </button>
              ))}
            </div>
          </div>

          {subscription && audience === "professionals" ? (
            <div className="mt-8 rounded-[8px] border border-[#1565c0] bg-[#f4fbff] px-6 py-4 max-[767px]:mx-2 max-[767px]:px-4">
              <p className="text-[16px] font-semibold tracking-[-0.05em] text-slate-950">
                You are on the {subscription.planName} plan.
              </p>
              <p className="mt-1 text-[15px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                {subscription.cancelAtPeriodEnd && periodEnd
                  ? `Your Pro plan ends on ${periodEnd}. You keep Pro and the ${subscription.commissionPercentage}% commission rate until then, and you can resume it before that date.`
                  : `Your commission is ${subscription.commissionPercentage}% on the final chargeable amount of each consultation.`}{" "}
                <Link href={SUBSCRIPTION_SETTINGS} className="font-semibold text-[#1565c0] underline">
                  Manage your subscription
                </Link>
                .
              </p>
            </div>
          ) : null}

          {!priced ? (
            <p className="mt-8 px-6 text-[14px] leading-5 tracking-[-0.05em] text-slate-500 max-[767px]:px-2">
              Prices for your country are confirmed at checkout before you pay.
            </p>
          ) : null}

          <div className="mt-10 grid items-stretch gap-6 px-6 max-[767px]:px-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4fbff] py-12">
        <div className={containerClass}>
          <div className="grid gap-5 px-6 max-[767px]:px-2 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[8px] bg-white p-5 shadow-[0_12px_35px_rgba(30,136,229,0.08)]">
                <Mark />
                <p className="text-[16px] font-semibold leading-6 tracking-[-0.05em] text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[78px] max-[767px]:py-12">
        <div className={containerClass}>
          <div className="grid gap-9 px-6 max-[767px]:px-2 lg:grid-cols-[380px_minmax(0,1fr)]">
            <div>
              <p className="text-[20px] font-light leading-7 tracking-[-0.05em] text-[#1565c0]">
                Share Swift HELP, earn rewards
              </p>
              <h2 className="mt-3 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
                Swift HELP Partner Network
              </h2>
              <p className="mt-5 text-[20px] font-light leading-7 tracking-[-0.05em] text-[#1e1e1e] max-[767px]:text-[15px] max-[767px]:leading-6">
                Invite the people and organizations you think Swift HELP would
                help. When they join and are verified, you earn a reward, and
                you can see and withdraw what you have earned at any time.
              </p>
              <Link
                href="/partner-network"
                className="mt-6 inline-flex min-h-[54px] items-center justify-center rounded-[45px] bg-[linear-gradient(180deg,#1565c0_0%,#0d3f6e_72.12%)] px-6 text-[17px] font-medium tracking-[-0.05em] text-white transition hover:brightness-110"
              >
                How the Partner Network works
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <article className="rounded-[8px] border border-[#dbeafe] bg-white p-5 shadow-sm">
                <h3 className="text-[24px] font-semibold leading-8 tracking-[-0.05em] text-slate-950">
                  Open to everyone
                </h3>
                <p className="mt-3 text-[15px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                  Patients, professionals and organizations all have a referral
                  code and a Referrals section in their account. There is
                  nothing to apply for and nothing to pay.
                </p>
              </article>

              <article className="rounded-[8px] border border-[#dbeafe] bg-white p-5 shadow-sm">
                <h3 className="text-[24px] font-semibold leading-8 tracking-[-0.05em] text-slate-950">
                  Rewards you can check
                </h3>
                <p className="mt-3 text-[15px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                  Every referral, the reward it earned and your withdrawable
                  balance are listed in your account, in your own currency.
                  Rewards rise as you reach each tier.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e3f2fd] py-[72px] max-[767px]:py-12">
        <div className={containerClass}>
          <div className="grid gap-5 px-6 max-[767px]:px-2 lg:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-[8px] bg-white p-6 shadow-[0_12px_35px_rgba(30,136,229,0.10)]">
                <h3 className="text-[22px] font-semibold leading-8 tracking-[-0.05em] text-slate-950">
                  {faq.question}
                </h3>
                <p className="mt-3 text-[16px] font-light leading-6 tracking-[-0.05em] text-slate-700">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {viewer.role ? null : (
        <section className="py-[72px] max-[767px]:py-12">
          <div className={containerClass}>
            <div className="px-6 text-center max-[767px]:px-2">
              <h2 className="m-0 text-[42px] font-semibold leading-[46px] tracking-[-0.05em] text-black max-[767px]:text-[30px] max-[767px]:leading-9">
                Ready for smarter healthcare access?
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/get-started/create-account?role=patient"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[45px] bg-[linear-gradient(180deg,#1565c0_0%,#0d3f6e_72.12%)] px-7 text-[17px] font-medium tracking-[-0.05em] text-white transition hover:brightness-110"
                >
                  Get started free
                </Link>
                <Link
                  href="/#contact"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[45px] border border-[#1565c0] bg-white px-7 text-[17px] font-medium tracking-[-0.05em] text-[#1565c0] transition hover:bg-[#e3f2fd]"
                >
                  Book a demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
