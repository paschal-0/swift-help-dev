import type { ProfessionalProfilePayload } from "@/services/authApi";

const PROFESSIONAL_ONBOARDING_DRAFT_KEY = "swifthelp.professionalOnboardingDraft.v1";

export type ProfessionalOnboardingDocument = {
  fileId?: string;
  name: string;
  sizeLabel: string;
  url?: string;
  mimeType?: string;
};

export type ProfessionalOnboardingDraft = Pick<
  ProfessionalProfilePayload,
  | "professionalName"
  | "licenseNumber"
  | "specialization"
  | "providerRoleId"
  | "experienceYears"
  | "consultationType"
  | "primaryPracticeLocation"
> & {
  uploadedDocuments?: ProfessionalOnboardingDocument[];
};

export function readProfessionalOnboardingDraft(): ProfessionalOnboardingDraft {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PROFESSIONAL_ONBOARDING_DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProfessionalOnboardingDraft;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeProfessionalOnboardingDraft(
  values: ProfessionalOnboardingDraft,
) {
  if (typeof window === "undefined") return;

  const current = readProfessionalOnboardingDraft();
  window.localStorage.setItem(
    PROFESSIONAL_ONBOARDING_DRAFT_KEY,
    JSON.stringify({ ...current, ...values }),
  );
}

export function clearProfessionalOnboardingDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFESSIONAL_ONBOARDING_DRAFT_KEY);
}
