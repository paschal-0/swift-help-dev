"use client";

import type { ReactNode } from "react";
import { ConsultationCallHost } from "@/components/consultation/ConsultationCallHost";
import { ProfessionalPlatformShell } from "./components/ProfessionalPlatformShell";

export default function ProfessionalPlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProfessionalPlatformShell>
      {children}
      {/* Above the router, so navigating does not unmount the call. */}
      <ConsultationCallHost />
    </ProfessionalPlatformShell>
  );
}

