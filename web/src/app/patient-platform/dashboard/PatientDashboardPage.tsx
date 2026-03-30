"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usePatientPlatformShell } from "../components/PatientPlatformShell";

type AppointmentStatus = "Done" | "Ongoing" | "Upcoming";

type Appointment = {
  id: string;
  day: string;
  doctor: string;
  time: string;
  status: AppointmentStatus;
  specialty: string;
};

type UpdateItem = {
  id: string;
  title: string;
  body: string;
  date: string;
};

type ActivityItem = {
  id: string;
  activity: string;
  time: string;
  status: "Completed" | "Pending";
};

const availableDays = ["MARCH 17", "MARCH 18", "MARCH 19"];

const appointments: Appointment[] = [
  { id: "appt-1", day: "MARCH 17", doctor: "Martin Samuel", time: "9:00am - 10:00 am", status: "Done", specialty: "Doctor" },
  { id: "appt-2", day: "MARCH 17", doctor: "Martin Samuel", time: "10:00am - 11:00 am", status: "Done", specialty: "Doctor" },
  { id: "appt-3", day: "MARCH 17", doctor: "Martin Samuel", time: "11:00am - 12:00 am", status: "Ongoing", specialty: "Doctor" },
  { id: "appt-4", day: "MARCH 17", doctor: "Martin Samuel", time: "12:00am - 1:00 am", status: "Upcoming", specialty: "Doctor" },
  { id: "appt-5", day: "MARCH 17", doctor: "Martin Samuel", time: "1:00am - 2:00 am", status: "Upcoming", specialty: "Doctor" },
  { id: "appt-6", day: "MARCH 18", doctor: "Daisy Watson", time: "9:00am - 10:00 am", status: "Upcoming", specialty: "Therapist" },
  { id: "appt-7", day: "MARCH 18", doctor: "Sarah Lane", time: "11:00am - 12:00 am", status: "Upcoming", specialty: "General Practitioner" },
  { id: "appt-8", day: "MARCH 19", doctor: "Dr Pedro Martins", time: "10:00am - 11:00 am", status: "Upcoming", specialty: "Cardiologist" },
];

const updatesSeed: UpdateItem[] = [
  {
    id: "update-1",
    title: "Medication reminder",
    body: "It is almost time to take your prescribed medication. Staying consistent helps support your treatment plan.",
    date: "17.03.2026",
  },
  {
    id: "update-2",
    title: "Medication reminder",
    body: "It is almost time to take your prescribed medication. Staying consistent helps support your treatment plan.",
    date: "17.03.2026",
  },
];

const activitiesSeed: ActivityItem[] = [
  { id: "act-1", activity: "Symptom assessment", time: "Today, 10:24 AM", status: "Completed" },
  { id: "act-2", activity: "Symptom assessment", time: "Today, 10:24 AM", status: "Completed" },
  { id: "act-3", activity: "Symptom assessment", time: "Today, 10:24 AM", status: "Completed" },
  { id: "act-4", activity: "Follow-up form", time: "Yesterday, 2:11 PM", status: "Pending" },
];

export function PatientDashboardPage() {
  const router = useRouter();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string>("appt-3");
  const [dismissedUpdateIds, setDismissedUpdateIds] = useState<string[]>([]);
  const { searchText } = usePatientPlatformShell();

  const selectedDay = availableDays[selectedDayIndex];
  const query = searchText.trim().toLowerCase();

  const visibleUpdates = useMemo(() => {
    const unresolved = updatesSeed.filter((u) => !dismissedUpdateIds.includes(u.id));
    if (!query) return unresolved;
    return unresolved.filter((u) => `${u.title} ${u.body} ${u.date}`.toLowerCase().includes(query));
  }, [dismissedUpdateIds, query]);

  const dayAppointments = useMemo(() => {
    const list = appointments.filter((a) => a.day === selectedDay);
    if (!query) return list;
    return list.filter((a) => `${a.doctor} ${a.time} ${a.status} ${a.specialty}`.toLowerCase().includes(query));
  }, [query, selectedDay]);

  const visibleActivities = useMemo(() => {
    if (!query) return activitiesSeed.slice(0, 3);
    return activitiesSeed
      .filter((a) => `${a.activity} ${a.time} ${a.status}`.toLowerCase().includes(query))
      .slice(0, 3);
  }, [query]);

  const activeAppointment = dayAppointments.find((a) => a.id === activeAppointmentId) ?? dayAppointments[0] ?? null;

  const stats = useMemo(
    () => [
      {
        title: "Upcoming appointments",
        value: `${dayAppointments.filter((a) => a.status !== "Done").length} Scheduled`,
        onClick: () => router.push("/patient-platform/appointments"),
      },
      {
        title: "Recent symptom checks",
        value: `${activitiesSeed.filter((a) => a.activity.toLowerCase().includes("symptom")).length} this month`,
        onClick: () => router.push("/patient-platform/symptom-checker"),
      },
      {
        title: "Last Consultation",
        value: "3 Days Ago",
        onClick: () => router.push("/patient-platform/consultations"),
      },
      {
        title: "Pending Follow-Ups",
        value: `${visibleUpdates.length} Action Needed`,
        onClick: () => router.push("/patient-platform/consultations"),
      },
    ],
    [dayAppointments, router, visibleUpdates.length]
  );

  const goPrevDay = () => setSelectedDayIndex((current) => Math.max(0, current - 1));
  const goNextDay = () => setSelectedDayIndex((current) => Math.min(availableDays.length - 1, current + 1));

  return (
    <div className="mt-3 w-full sm:mt-4 xl:mt-[22px]">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[551px_337px] xl:gap-4">
          <motion.article
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative min-h-[188px] overflow-hidden rounded-[20px] bg-[#F8FAFC] sm:min-h-[204px] xl:min-h-[211px] xl:rounded-2xl"
          >
            <div className="absolute inset-0 bg-[linear-gradient(121deg,#f8fafc_0%,#f0f6fd_42%,#e8f3ff_100%)]" />
            <div className="absolute left-3 top-3 z-20 flex w-[156px] flex-col gap-4 sm:left-4 sm:top-4 sm:w-[205px] sm:gap-6 xl:left-5 xl:top-[15px] xl:w-[246px] xl:gap-9">
              <div className="inline-flex h-[23px] w-fit items-center justify-center gap-1.5 rounded-full bg-[#E3F2FD] px-2.5 sm:h-[25px] sm:gap-2 sm:px-3 xl:h-[26.81px] xl:w-[180px] xl:gap-[3.06px] xl:rounded-[30.6383px] xl:px-[7.65957px]">
                <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-4 sm:w-4 xl:h-[18.38px] xl:w-[18.38px]" aria-hidden>
                  <path fill="#1565C0" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm12 8H5v10h14V10Z" />
                </svg>
                <span className="text-[10px] font-light leading-none tracking-[-0.05em] text-[#1565C0] sm:text-[11px] xl:text-[12.2553px] xl:leading-3">
                  March 17, 2026 10:20 am
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-[16px] font-medium leading-5 tracking-[-0.05em] text-[#334155] sm:text-[18px] sm:leading-6">
                  Welcome back, Precious
                </h2>
                <p className="max-w-[150px] text-[12px] font-light leading-[14px] tracking-[-0.04em] text-[#334155] sm:max-w-[190px] sm:text-[14px] sm:leading-4 xl:max-w-[207px] xl:text-[16px] xl:tracking-[-0.05em]">
                  Here is an overview of your care activity and what you can do next.
                </p>
              </div>
            </div>

            <Image
              src="/doctor-mobile.png"
              alt="Doctors illustration"
              width={128}
              height={126}
              className="absolute right-2 top-[42px] z-0 h-auto w-[128px] object-contain opacity-85 sm:hidden"
            />
            <Image
              src="/Group 14.png"
              alt="Doctors illustration"
              width={280}
              height={211}
              className="absolute bottom-0 right-0 z-0 hidden h-full w-[240px] object-cover opacity-85 sm:block xl:w-[280px]"
            />
          </motion.article>

          <motion.article
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative min-h-[188px] overflow-hidden rounded-[20px] bg-[#1565C0] sm:min-h-[204px] xl:min-h-[211px] xl:rounded-2xl"
          >
            <Image src="/doctor.jpg" alt="Quick assessment background" fill className="object-cover mix-blend-soft-light opacity-75" />
            <div className="absolute left-4 top-5 z-10 max-w-[184px] space-y-1 text-[#F8FAFC] sm:top-7 sm:max-w-[205px] xl:top-9 xl:max-w-[207px]">
              <h2 className="text-[16px] font-medium leading-5 tracking-[-0.05em] sm:text-[18px] sm:leading-6">Not Feeling Well?</h2>
              <p className="text-[13px] font-light leading-[14px] tracking-[-0.04em] sm:text-[15px] sm:leading-4 xl:text-[16px] xl:tracking-[-0.05em]">
                Start a quick symptom assessment to receive guidance and the right next steps.
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => router.push("/patient-platform/symptom-checker")}
              className="absolute bottom-4 left-4 inline-flex h-[32px] cursor-pointer items-center justify-center rounded-[12px] bg-[#F8FAFC] px-3 text-[12px] font-normal leading-none tracking-[-0.04em] text-[#1565C0] sm:bottom-5 sm:h-[34px] sm:px-3.5 sm:text-[13px] xl:bottom-[21px] xl:h-[34.76px] xl:rounded-[12.7318px] xl:px-[7.48374px] xl:text-[14.0766px] xl:leading-[21px] xl:tracking-[-0.05em]"
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Symptom Check
            </motion.button>
          </motion.article>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 xl:mt-4 xl:grid-cols-4 xl:gap-[10px]">
          {stats.map((stat) => (
            <motion.button
              key={stat.title}
              type="button"
              onClick={stat.onClick}
              className="min-h-[86px] cursor-pointer rounded-xl bg-[#F8FAFC] p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(148,163,184,0.25)] xl:h-20 xl:min-h-0 xl:p-[11px]"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 xl:gap-[7px]">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#E3F2FD] xl:h-16 xl:w-[59px] xl:rounded-xl">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 xl:h-8 xl:w-8" aria-hidden>
                    <path fill="#1565C0" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm12 8H5v10h14V10Z" />
                  </svg>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 xl:gap-3">
                  <p className="max-w-[94px] text-[10px] font-normal leading-3 tracking-[-0.04em] text-[#94A3B8] sm:max-w-[120px] sm:text-[11px] xl:max-w-[132px] xl:text-[12px] xl:leading-[14px] xl:tracking-[-0.05em]">
                    {stat.title}
                  </p>
                  <p className="text-[14px] font-light leading-[18px] tracking-[-0.04em] text-[#334155] sm:text-[16px] sm:leading-5 xl:text-[18px] xl:leading-[22px] xl:tracking-[-0.05em]">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[551px_337px]">
          <article className="relative min-h-[399px] rounded-2xl bg-[#F8FAFC] px-4 pt-4 sm:px-[17px]">
            <h3 className="text-[18px] font-medium leading-5 tracking-[-0.05em] text-[#334155]">Appointments</h3>

            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={goPrevDay} disabled={selectedDayIndex === 0} className="cursor-pointer text-[#334155] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous day">
                &lt;
              </button>
              <span className="text-[14px] font-normal leading-5 tracking-[-0.05em] text-[#94A3B8]">{selectedDay}</span>
              <button type="button" onClick={goNextDay} disabled={selectedDayIndex === availableDays.length - 1} className="cursor-pointer text-[#334155] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next day">
                &gt;
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:hidden">
              {dayAppointments.length ? (
                dayAppointments.map((appt) => (
                  <motion.div
                    key={`${appt.id}-mobile`}
                    className={`rounded-2xl border p-4 transition ${
                      appt.status === "Ongoing"
                        ? "border-[#bfdbfe] bg-[#eff6ff] shadow-[0_10px_24px_rgba(30,136,229,0.12)]"
                        : "border-[#e2e8f0] bg-white"
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#e2e8f0]">
                          <Image src="/doctor.jpg" alt={`Dr ${appt.doctor}`} width={40} height={40} className="h-full w-full object-cover" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-[-0.04em] text-[#334155]">Dr. {appt.doctor}</p>
                          <p className="mt-0.5 text-[11px] uppercase tracking-[-0.02em] text-[#94A3B8]">{appt.specialty}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold tracking-[-0.03em] ${
                          appt.status === "Ongoing"
                            ? "bg-[#1565C0] text-white"
                            : appt.status === "Done"
                              ? "bg-[#e2e8f0] text-[#64748B]"
                              : "bg-[#f1f5f9] text-[#64748B]"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3">
                      <div className="flex min-w-0 items-center gap-2 text-[#64748B]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11H8v-2h3V6h2Z"
                          />
                        </svg>
                        <span className="truncate text-xs font-medium tracking-[-0.03em]">{appt.time}</span>
                      </div>

                      {appt.status === "Ongoing" ? (
                        <motion.button
                          type="button"
                          onClick={() => router.push("/patient-platform/consultations")}
                          className="shrink-0 rounded-lg bg-[#1565C0] px-4 py-1.5 text-xs font-semibold tracking-[-0.03em] text-white shadow-[0_8px_18px_rgba(21,101,192,0.25)] transition hover:bg-[#114B7F]"
                          whileHover={{ y: -1, scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          Join Call
                        </motion.button>
                      ) : null}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#94A3B8] p-4 text-sm text-[#64748B]">No appointments found for this day/search.</div>
              )}
            </div>

            <div className="mt-3 hidden grid-cols-1 gap-3 lg:grid lg:grid-cols-[52px_1fr_255px]">
              <div className="flex flex-col items-center gap-2 text-[14px] font-medium leading-[10px] tracking-[-0.05em] text-[#94A3B8]">
                {dayAppointments.map((appt, index) => (
                  <div key={`${appt.id}-time`} className="flex h-[50px] flex-col items-center justify-center">
                    <span className={index === 2 ? "text-[#1565C0]" : ""}>{appt.time.split("-")[0].trim().replace("am", "")}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {dayAppointments.length ? (
                  dayAppointments.map((row) => (
                    <motion.button
                      key={row.id}
                      type="button"
                      onClick={() => setActiveAppointmentId(row.id)}
                      className={`relative h-[50px] rounded-xl border px-2 text-left transition ${
                        row.id === activeAppointmentId ? "border-[#1E88E5] bg-[#f5faff]" : "border-[#E2E8F0] bg-transparent hover:bg-[#f8fbff]"
                      } cursor-pointer`}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="absolute left-2 top-1 flex w-[120px] flex-col">
                        <span className={`text-[14px] tracking-[-0.05em] ${row.id === activeAppointmentId ? "text-[#334155]" : "text-[#94A3B8]"}`}>{row.doctor}</span>
                        <span className={`text-[12px] font-light tracking-[-0.05em] ${row.id === activeAppointmentId ? "text-[#334155]" : "text-[#94A3B8]"}`}>{row.time}</span>
                      </div>
                      <span
                        className={`absolute right-2 top-[13px] inline-flex h-[23px] min-w-[58px] items-center justify-center rounded-md px-2 text-[10px] tracking-[-0.05em] ${
                          row.status === "Ongoing"
                            ? "bg-[#E3F2FD] text-[#1565C0]"
                            : row.status === "Done"
                              ? "border border-[#94A3B8] bg-[#E2E8F0] text-[#94A3B8]"
                              : "border border-[#94A3B8] bg-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        {row.status}
                      </span>
                    </motion.button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#94A3B8] p-4 text-sm text-[#64748B]">No appointments found for this day/search.</div>
                )}
              </div>

              <div className="rounded-xl bg-[#E3F2FD] p-3">
                <div className="relative h-[121px] overflow-hidden rounded-lg">
                  <Image src="/doctor.jpg" alt="Doctor consultation" fill className="object-cover" />
                  <div className="absolute right-2 top-2 rounded-[15px] bg-[#E3F2FD] px-2 py-1 text-[7.5px] font-medium tracking-[-0.05em] text-[#1E88E5]">
                    {activeAppointment?.status ?? "Upcoming"}
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-semibold leading-4 tracking-[-0.05em] text-[#F8FAFC]">
                    <p>Name: Dr {activeAppointment?.doctor ?? "Martin Samuel"}</p>
                    <p>specialty: {activeAppointment?.specialty ?? "Doctor"}</p>
                  </div>
                </div>

                <div className="mt-3 text-[14px] font-medium leading-3 tracking-[-0.05em] text-[#334155]">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <p key={idx}>Date: March 227 2026</p>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => router.push("/patient-platform/appointments")}
                    className="inline-flex h-[25px] flex-1 cursor-pointer items-center justify-center rounded-[9.26984px] border border-[#334155] text-[10.2489px] font-normal leading-[15px] tracking-[-0.05em] text-[#334155]"
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    View all
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => router.push("/patient-platform/consultations")}
                    className="inline-flex h-[26px] flex-1 cursor-pointer items-center justify-center rounded-[9.52381px] bg-[linear-gradient(180deg,#1E88E5_0%,#114B7F_72.12%)] text-[10.5297px] font-normal leading-4 tracking-[-0.05em] text-[#E3F2FD]"
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Join call
                  </motion.button>
                </div>
              </div>
            </div>
          </article>

          <article className="relative hidden min-h-[399px] rounded-2xl bg-[#F8FAFC] px-[13px] pt-4 xl:block">
            <h3 className="text-[18px] font-medium leading-5 tracking-[-0.05em] text-[#334155]">Important Updates</h3>

            <div className="mt-4 space-y-2">
              {visibleUpdates.length ? (
                visibleUpdates.map((item) => (
                  <div key={item.id} className="relative min-h-[158px] rounded-md border border-[#1E88E5]/60 bg-[#F8FAFC] p-2">
                    <div className="inline-flex h-[16.56px] w-[59.05px] items-center justify-center rounded-[15.0507px] bg-[#E3F2FD] text-[10px] font-medium leading-[15px] tracking-[-0.05em] text-[#1E88E5]">
                      Due soon
                    </div>
                    <span className="absolute right-2 top-[10px] text-[10px] leading-[15px] tracking-[-0.05em] text-[#94A3B8]">{item.date}</span>
                    <div className="mt-3 w-[264px]">
                      <h4 className="text-[16px] font-normal leading-[15px] tracking-[-0.05em] text-[#334155]">{item.title}</h4>
                      <p className="mt-[7px] text-[13px] font-light leading-[15px] tracking-[-0.05em] text-[#94A3B8]">{item.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDismissedUpdateIds((current) => [...current, item.id]);
                        toast.success("Reminder marked");
                      }}
                      className="mt-3 inline-flex h-[23.47px] w-[116px] cursor-pointer items-center justify-center rounded-[8.59779px] bg-[#1565C0] text-[9.50592px] font-normal leading-[14px] tracking-[-0.05em] text-[#F8FAFC]"
                    >
                      Set Reminder+Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#94A3B8] p-4 text-sm text-[#64748B]">No updates match your search.</div>
              )}
            </div>
          </article>
        </div>

        <article className="relative mt-4 min-h-[329px] w-full rounded-xl bg-[#F8FAFC] px-4 pb-4 pt-4 sm:px-[19px] sm:pt-[21px]">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-medium leading-5 tracking-[-0.05em] text-[#334155]">Recent Activities</h3>
            <motion.button
              type="button"
              onClick={() => router.push("/patient-platform/consultations")}
              className="inline-flex h-[30px] w-[72px] cursor-pointer items-center justify-center rounded-md bg-[#E3F2FD] text-[14px] font-medium leading-5 tracking-[-0.05em] text-[#1565C0] sm:h-[26px] sm:w-[66px] sm:text-[18px]"
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              See all
            </motion.button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:hidden">
            {visibleActivities.length ? (
              visibleActivities.map((row) => (
                <motion.button
                  key={`${row.id}-mobile`}
                  type="button"
                  onClick={() => router.push("/patient-platform/consultations")}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-3 py-3 text-left"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium tracking-[-0.04em] text-[#334155]">{row.activity}</p>
                    <p className="mt-1 text-[11px] tracking-[-0.03em] text-[#94A3B8]">{row.time}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[-0.03em] ${
                      row.status === "Completed" ? "bg-[#D9F6E7] text-[#15A937]" : "bg-[#FEF3C7] text-[#B45309]"
                    }`}
                  >
                    {row.status}
                  </span>
                </motion.button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#94A3B8] p-4 text-sm text-[#64748B]">No activities match your search.</div>
            )}
          </div>

          <div className="mt-4 hidden grid-cols-3 rounded-xl bg-[#0F172A] px-6 py-5 text-[14px] font-normal leading-5 tracking-[-0.05em] text-[#F8FAFC] sm:grid sm:px-10 sm:text-[18px]">
            <span>Activity</span>
            <span>Time</span>
            <span className="text-right">Status</span>
          </div>

          <div className="mt-3 hidden sm:block">
            {visibleActivities.length ? (
              visibleActivities.map((row) => (
                <motion.button
                  key={row.id}
                  type="button"
                  onClick={() => router.push("/patient-platform/consultations")}
                  className="grid h-[52px] w-full cursor-pointer grid-cols-3 items-center border-b border-[#94A3B8] px-[17px] text-left"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <span className="text-[14px] font-normal leading-5 tracking-[-0.05em] text-[#94A3B8] sm:text-[18px]">{row.activity}</span>
                  <span className="text-[14px] font-normal leading-5 tracking-[-0.05em] text-[#94A3B8] sm:text-[18px]">{row.time}</span>
                  <span className="justify-self-end inline-flex h-[30px] min-w-[115px] items-center justify-center rounded-3xl bg-[#D9F6E7] px-[10px] text-[14px] font-normal leading-5 tracking-[-0.05em] text-[#15A937] sm:text-[18px]">
                    {row.status}
                  </span>
                </motion.button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#94A3B8] p-4 text-sm text-[#64748B]">No activities match your search.</div>
            )}
          </div>
        </article>
    </div>
  );
}

