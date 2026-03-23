import { Suspense } from "react";
import { GetStartedaccountPage } from "./GetStartedaccountPage";

export default function GetStartedCreateAccountRoute() {
  return (
    <Suspense fallback={null}>
      <GetStartedaccountPage />
    </Suspense>
  );
}
