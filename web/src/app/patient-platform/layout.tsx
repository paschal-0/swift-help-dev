"use client";

import type { ReactNode } from "react";
import { PatientPlatformShell } from "./components/PatientPlatformShell";

export default function PatientPlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PatientPlatformShell>{children}</PatientPlatformShell>;
}
