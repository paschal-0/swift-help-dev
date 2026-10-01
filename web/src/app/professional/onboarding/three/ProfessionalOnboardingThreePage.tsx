"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { useBlurValidationToast } from "@/lib/useBlurValidationToast";
import {
  clearProfessionalOnboardingDraft,
  readProfessionalOnboardingDraft,
  type ProfessionalOnboardingDocument,
  type ProfessionalOnboardingDraft,
} from "@/lib/professionalOnboardingDraft";
import { getApiErrorMessage, getProfile, updateProfessionalProfile } from "@/services/authApi";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayAvailability = {
  enabled: boolean;
  from: string;
  to: string;
};

type RecoveryAction = {
  label: string;
  href: string;
};

type SavedProfessionalProfileResponse = {
  profile?: {
    professionalName?: string | null;
    licenseNumber?: string | null;
    specialization?: string | null;
    providerRoleId?: string | null;
    experienceYears?: number | null;
    consultationType?: string | null;
    primaryPracticeLocation?: string | null;
    uploadedDocuments?: ProfessionalOnboardingDocument[] | null;
    availability?: Partial<Record<DayKey, Partial<DayAvailability>>> | null;
  } | null;
};

const dayLabels: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const initialAvailability: Record<DayKey, DayAvailability> = {
  monday: { enabled: true, from: "09:00", to: "18:00" },
  tuesday: { enabled: true, from: "09:00", to: "18:00" },
  wednesday: { enabled: true, from: "09:00", to: "18:00" },
  thursday: { enabled: true, from: "09:00", to: "18:00" },
  friday: { enabled: true, from: "09:00", to: "18:00" },
  saturday: { enabled: true, from: "09:00", to: "18:00" },
  sunday: { enabled: true, from: "09:00", to: "18:00" },
};

const orderedDays = Object.keys(initialAvailability) as DayKey[];
const profileDetailFields = new Set([
  "professionalName",
  "licenseNumber",
  "specialization",
  "providerRoleId",
  "experienceYears",
  "consultationType",
  "primaryPracticeLocation",
]);

function parseMissingOnboardingFields(message: string) {
  const marker = "Missing:";
  const markerIndex = message.indexOf(marker);

  if (markerIndex === -1) return [];

  return message
    .slice(markerIndex + marker.length)
    .split(",")
    .map((field) => field.trim().replace(/[.。]$/, ""))
    .filter(Boolean);
}

function getRecoveryActionsForMissingFields(fields: string[]) {
  const actions: RecoveryAction[] = [];
  const addAction = (action: RecoveryAction) => {
    if (!actions.some((item) => item.href === action.href)) {
      actions.push(action);
    }
  };

  if (fields.some((field) => profileDetailFields.has(field))) {
    addAction({
      label: "Go to profile details",
      href: "/professional/onboarding/one",
    });
  }

  if (fields.includes("uploadedDocuments")) {
    addAction({
      label: "Upload documents",
      href: "/professional/onboarding/two",
    });
  }

  if (fields.includes("availability")) {
    addAction({
      label: "Set availability",
      href: "/professional/onboarding/three",
    });
  }

  return actions;
}

function withCurrentLocale(pathname: string | null, href: string) {
  const firstSegment = pathname?.split("/").filter(Boolean)[0];
  const hasLocalePrefix =
    firstSegment &&
    firstSegment.length <= 5 &&
    !["professional", "patient", "organisation", "super-admin-platform"].includes(firstSegment);

  return hasLocalePrefix ? `/${firstSegment}${href}` : href;
}

function normalizeAvailability(
  savedAvailability?: Partial<Record<DayKey, Partial<DayAvailability>>> | null,
) {
  if (!savedAvailability) return initialAvailability;

  return orderedDays.reduce<Record<DayKey, DayAvailability>>((next, day) => {
    const savedDay = savedAvailability[day];
    next[day] = {
      enabled:
        typeof savedDay?.enabled === "boolean"
          ? savedDay.enabled
          : initialAvailability[day].enabled,
      from: savedDay?.from || initialAvailability[day].from,
      to: savedDay?.to || initialAvailability[day].to,
    };
    return next;
  }, { ...initialAvailability });
}

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function firstNumber(...values: Array<number | null | undefined>) {
  return values.find((value): value is number => typeof value === "number");
}

function firstDocuments(
  ...values: Array<ProfessionalOnboardingDocument[] | null | undefined>
) {
  return values.find(
    (documents): documents is ProfessionalOnboardingDocument[] =>
      Array.isArray(documents) && documents.length > 0,
  );
}

function buildCompletionProfilePayload(
  savedProfile: SavedProfessionalProfileResponse["profile"],
  draft: ProfessionalOnboardingDraft,
) {
  return {
    professionalName:
      cleanString(savedProfile?.professionalName) ||
      cleanString(draft.professionalName),
    licenseNumber:
      cleanString(savedProfile?.licenseNumber) ||
      cleanString(draft.licenseNumber),
    specialization:
      cleanString(savedProfile?.specialization) ||
      cleanString(draft.specialization),
    providerRoleId:
      cleanString(savedProfile?.providerRoleId) ||
      cleanString(draft.providerRoleId),
    experienceYears: firstNumber(
      savedProfile?.experienceYears,
      draft.experienceYears,
    ),
    consultationType:
      cleanString(savedProfile?.consultationType) ||
      cleanString(draft.consultationType),
    primaryPracticeLocation:
      cleanString(savedProfile?.primaryPracticeLocation) ||
      cleanString(draft.primaryPracticeLocation),
    uploadedDocuments: firstDocuments(
      savedProfile?.uploadedDocuments,
      draft.uploadedDocuments,
    ),
  };
}

function formatTimeLabel(timeValue: string) {
  const [hourValue, minuteValue] = timeValue.split(":");
  const hourNumber = Number(hourValue);
  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const normalizedHour = hourNumber % 12 || 12;
  return `${normalizedHour}:${minuteValue} ${suffix}`;
}

function AvailabilityToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-[50px] cursor-pointer items-center rounded-full transition ${
        checked ? "bg-[#1565c0]" : "bg-[#cbd5e1]"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white transition ${
          checked ? "translate-x-[28px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function TimeInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <label
      className={`relative flex h-[46px] w-full items-center rounded-full border border-[#cbd5e1] bg-white px-5 md:w-[220px] lg:w-[240px] xl:w-[260px] ${
        disabled ? "opacity-45 grayscale" : ""
      }`}
    >
      <span className="text-[14px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8] md:text-[16px]">
        {label}
      </span>
      <input
        type="time"
        step="1800"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer rounded-full border-0 bg-transparent px-[22px] text-right text-[15px] font-semibold leading-[22px] tracking-[-0.05em] text-transparent opacity-0 outline-none [color-scheme:light] disabled:cursor-not-allowed md:text-[16px]"
      />
      <span className="pointer-events-none ml-auto pl-2 text-[15px] font-semibold leading-[22px] tracking-[-0.05em] text-[#0f172a] md:text-[16px]">
        {formatTimeLabel(value)}
      </span>
    </label>
  );
}

export function ProfessionalOnboardingThreePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryPrompt, setRecoveryPrompt] = useState<{
    missingFields: string[];
    actions: RecoveryAction[];
  } | null>(null);
  const showValidationToast = useBlurValidationToast();
  const [availability, setAvailability] =
    useState<Record<DayKey, DayAvailability>>(initialAvailability);
  const [savedProfile, setSavedProfile] =
    useState<SavedProfessionalProfileResponse["profile"]>(null);

  const hasAvailableDay = orderedDays.some((day) => availability[day].enabled);
  const validationError = hasAvailableDay
    ? null
    : "Please enable availability for at least one day.";

  useEffect(() => {
    if (!hasInteracted) {
      return;
    }
    showValidationToast("professional-onboarding-three", validationError);
  }, [hasInteracted, showValidationToast, validationError]);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((response) => {
        if (!isMounted) return;

        const savedAvailability = (response as SavedProfessionalProfileResponse)
          .profile?.availability;
        setSavedProfile((response as SavedProfessionalProfileResponse).profile ?? null);
        if (savedAvailability) {
          setAvailability(normalizeAvailability(savedAvailability));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationError) {
      setHasInteracted(true);
      showValidationToast("professional-onboarding-three", validationError);
      return;
    }

    setIsSubmitting(true);
    setRecoveryPrompt(null);

    try {
      const completionProfilePayload = buildCompletionProfilePayload(
        savedProfile,
        readProfessionalOnboardingDraft(),
      );

      await updateProfessionalProfile({
        ...completionProfilePayload,
        availability,
        onboardingCompleted: true,
      });
      clearProfessionalOnboardingDraft();
      router.push("/professional-platform");
    } catch (error) {
      const message = getApiErrorMessage(error);
      const missingFields = parseMissingOnboardingFields(message);
      const actions = getRecoveryActionsForMissingFields(missingFields);

      if (actions.length) {
        setRecoveryPrompt({ missingFields, actions });
        toast.error("Complete the missing onboarding steps to continue.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f8fafc] px-4 py-6 md:px-[63px] md:py-[51px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10 inline-flex items-center gap-1 text-[28px] font-medium tracking-[-0.05em] text-[#1e88e5] md:mb-[50px] max-[900px]:text-[22px]"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center max-[900px]:h-9 max-[900px]:w-9">
            <Image
              src="/jam_medical.png"
              alt="SwiftHelp logo"
              width={40}
              height={40}
              sizes="40px"
              className="h-12 w-12 object-contain max-[900px]:h-9 max-[900px]:w-9"
              priority
            />
          </span>
          <span className="text-[#1e88e5]">SwiftHelp</span>
        </motion.div>

        <div className="mx-auto flex w-full max-w-[1490px] flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scaleX: 0.95 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 flex w-full max-w-[1160px] items-center justify-between gap-4 md:mb-[80px] md:gap-[52px]"
          >
            <div className="h-2 w-1/3 rounded-[40px] bg-[#30b11f] md:h-3" />
            <div className="h-2 w-1/3 rounded-[40px] bg-[#30b11f] md:h-3" />
            <div className="relative h-2 w-1/3 overflow-hidden rounded-[40px] bg-[#dbe4f0] md:h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.25, ease: "circOut" }}
                className="absolute left-0 top-0 h-full rounded-[40px] bg-[#30b11f]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 flex w-full max-w-[760px] flex-col items-center gap-2 text-center md:mb-[52px] md:gap-3"
          >
            <h1 className="m-0 text-[28px] font-normal leading-tight tracking-[-0.05em] text-[#334155] md:text-[36px] md:leading-[54px]">
              Set your care availability
            </h1>
            <p className="m-0 max-w-[720px] text-[16px] font-light leading-snug tracking-[-0.05em] text-black md:text-[18px] md:leading-[22px]">
              Choose when you&apos;re available to accept consultations and
              staffing assignments.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            onBlurCapture={() => setHasInteracted(true)}
            onClickCapture={() => setHasInteracted(true)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex w-full flex-col items-center gap-10 pb-[40px] md:gap-[72px]"
          >
            <div className="w-full max-w-[1360px] rounded-[32px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] md:px-[40px] md:py-[42px]">
              <div className="flex flex-col gap-8">
                <h2 className="m-0 text-[24px] font-light leading-[30px] tracking-[-0.05em] text-black">
                  Set Your Availability
                </h2>

                <div className="flex flex-col gap-6 md:gap-7">
                  {orderedDays.map((day) => {
                    const dayState = availability[day];

                    return (
                      <div
                        key={day}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex w-full min-w-[150px] items-center gap-3">
                          <AvailabilityToggle
                            checked={dayState.enabled}
                            onChange={() =>
                              setAvailability((current) => ({
                                ...current,
                                [day]: {
                                  ...current[day],
                                  enabled: !current[day].enabled,
                                },
                              }))
                            }
                          />
                          <span className="text-[16px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8] md:text-[18px]">
                            {dayLabels[day]}
                          </span>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center md:gap-4 lg:gap-6">
                          <TimeInput
                            label="From"
                            value={dayState.from}
                            disabled={!dayState.enabled}
                            onChange={(event) =>
                              setAvailability((current) => ({
                                ...current,
                                [day]: {
                                  ...current[day],
                                  from: event.target.value,
                                },
                              }))
                            }
                          />
                          <TimeInput
                            label="To"
                            value={dayState.to}
                            disabled={!dayState.enabled}
                            onChange={(event) =>
                              setAvailability((current) => ({
                                ...current,
                                [day]: {
                                  ...current[day],
                                  to: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="m-0 max-w-[760px] text-center text-[18px] font-semibold leading-[24px] tracking-[-0.05em] text-[#1565c0] md:text-[20px]">
              Your account will be reviewed before you begin accepting
              consultations.
            </p>

            {recoveryPrompt ? (
              <div
                role="alert"
                className="w-full max-w-[760px] rounded-[24px] border border-[#fecaca] bg-[#fff1f2] px-5 py-4 text-left shadow-[0_14px_32px_rgba(185,28,28,0.08)]"
              >
                <h3 className="m-0 text-[16px] font-semibold leading-6 text-[#991b1b]">
                  Finish your professional onboarding
                </h3>
                <p className="mt-1 text-[14px] leading-5 text-[#7f1d1d]">
                  Some required details are still missing. Complete the step
                  below, then return here to submit for review.
                </p>
                {recoveryPrompt.missingFields.length ? (
                  <p className="mt-2 text-[13px] leading-5 text-[#9f1239]">
                    Missing: {recoveryPrompt.missingFields.join(", ")}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {recoveryPrompt.actions.map((action) => (
                    <button
                      key={action.href}
                      type="button"
                      onClick={() =>
                        router.push(withCurrentLocale(pathname, action.href))
                      }
                      className="inline-flex min-h-[42px] items-center justify-center rounded-[14px] bg-[#1565c0] px-4 text-[14px] font-semibold text-white transition hover:brightness-105 focus-visible:outline-0 focus-visible:ring-4 focus-visible:ring-[#bfdbfe]"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="w-full max-w-[444px]">
              <button
                type="submit"
                disabled={!hasAvailableDay || isSubmitting}
                className="inline-flex h-[50px] w-full items-center justify-center rounded-[18.0973px] bg-[linear-gradient(180deg,#1e88e5_0%,#114b7f_72.12%)] px-[10.6375px] text-[20px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_24px_rgba(21,101,192,0.28)] focus-visible:outline-0 focus-visible:ring-4 focus-visible:ring-[#bfdbfe] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:hover:shadow-none"
              >
                {isSubmitting ? "Saving..." : "Submit for Review"}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
