import { Suspense } from "react";
import { PatientAppointmentConfirmedPage } from "./PatientAppointmentConfirmedPage";

export default function PatientAppointmentConfirmedRoute() {
  return (
    <Suspense fallback={null}>
      <PatientAppointmentConfirmedPage />
    </Suspense>
  );
}
