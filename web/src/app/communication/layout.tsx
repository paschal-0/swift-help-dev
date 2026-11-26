"use client";

import type { ReactNode } from "react";
import { ConsultationCallHost } from "@/components/consultation/ConsultationCallHost";

/**
 * Communication rooms use the same video room component, so they need the
 * same host above them. Without it a call started here would keep running
 * with nothing to play its audio or offer a way back.
 */
export default function CommunicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <ConsultationCallHost />
    </>
  );
}
