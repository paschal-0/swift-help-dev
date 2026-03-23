import { Suspense } from "react";
import { GetStartedOtpPage } from "./GetStartedOtpPage";

export default function GetStartedOtpRoute() {
  return (
    <Suspense fallback={null}>
      <GetStartedOtpPage />
    </Suspense>
  );
}
