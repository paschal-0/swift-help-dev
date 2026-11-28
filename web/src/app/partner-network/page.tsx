import type { Metadata } from "next";

import { Header } from "../landing/components/Header";
import { FooterSection } from "../landing/sections/FooterSection";
import { PartnerNetworkPage } from "./PartnerNetworkPage";

export const metadata: Metadata = {
  title: "Partner Network | Swift Help",
  description:
    "How the Swift HELP Partner Network works: who can take part, what you earn for a verified referral, and how to withdraw it.",
};

export default function PartnerNetworkRoute() {
  return (
    <div className="w-full overflow-x-hidden bg-white text-slate-900">
      <div className="[zoom:0.92] max-[1320px]:[zoom:1]">
        <Header />
      </div>
      <PartnerNetworkPage />
      <div className="[zoom:0.92] max-[1320px]:[zoom:1]">
        <FooterSection />
      </div>
    </div>
  );
}
