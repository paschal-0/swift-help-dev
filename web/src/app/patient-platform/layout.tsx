"use client";

import type { ReactNode } from "react";
import { ConsultationCallHost } from "@/components/consultation/ConsultationCallHost";
import { PatientPlatformShell } from "./components/PatientPlatformShell";

export default function PatientPlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PatientPlatformShell>
      {children}
      {/* Above the router, so navigating does not unmount the call. */}
      <ConsultationCallHost />
    </PatientPlatformShell>
  );
}
