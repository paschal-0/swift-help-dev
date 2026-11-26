"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Cancelling refunds the patient in full, so it is never a single press.
 *
 * The dialog says what happens to the money before anything happens to it,
 * asks why, and keeps the safe option as the one under the thumb. Confirming
 * is the deliberate act; dismissing changes nothing.
 */

type CancelConsultationDialogProps = {
  open: boolean;
  /**
   * `cancel` ends the appointment and returns the money. `dispute` sends a
   * consultation that has already happened to Swift HELP, and moves nothing
   * by itself - which is the whole point of it being a separate action.
   */
  variant?: "cancel" | "dispute";
  /** Who is cancelling, which changes what the consequences are. */
  actor: "patient" | "professional";
  consultationLabel?: string | null;
  /** What the patient paid, in minor units, when known. */
  amountMinor?: number | null;
  currency?: string | null;
  busy?: boolean;
  onKeep: () => void;
  onConfirm: (reason: string) => void;
};

const REASONS: Record<
  "cancel" | "dispute",
  Record<"patient" | "professional", string[]>
> = {
  cancel: {
    patient: [
      "I no longer need this appointment",
      "I am not available at this time",
      "I booked the wrong time or professional",
      "Something else",
    ],
    professional: [
      "I am no longer available at this time",
      "The patient asked to rebook",
      "This booking was made in error",
      "Something else",
    ],
  },
  dispute: {
    patient: [
      "The consultation did not take place",
      "It ended much earlier than booked",
      "I was charged the wrong amount",
      "Something else",
    ],
    professional: [
      "This was cancelled by mistake",
      "The patient did not attend",
      "I was paid the wrong amount",
      "Something else",
    ],
  },
};

function formatAmount(amountMinor?: number | null, currency?: string | null) {
  if (typeof amountMinor !== "number" || !Number.isFinite(amountMinor)) {
    return null;
  }
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(amountMinor / 100);
  } catch {
    return null;
  }
}

export function CancelConsultationDialog({
  open,
  ...props
}: CancelConsultationDialogProps) {
  return (
    <AnimatePresence>
      {/* Mounted only while open, so the reason and the chosen option start
          empty every time and a reason typed for one appointment can never be
          submitted against another. */}
      {open ? <CancelConsultationForm {...props} /> : null}
    </AnimatePresence>
  );
}

function CancelConsultationForm({
  variant = "cancel",
  actor,
  consultationLabel,
  amountMinor,
  currency,
  busy = false,
  onKeep,
  onConfirm,
}: Omit<CancelConsultationDialogProps, "open">) {
  const [choice, setChoice] = useState("");
  const [detail, setDetail] = useState("");

  const isDispute = variant === "dispute";
  const amount = formatAmount(amountMinor, currency);
  const isOther = choice === "Something else";
  const reason = isOther ? detail.trim() : choice;
  const canConfirm = reason.length > 0 && !busy;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-consultation-title"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-[16px] bg-white p-5 shadow-xl"
      >
        <h2
          id="cancel-consultation-title"
          className="text-[18px] font-semibold tracking-[-0.03em] text-[#0F172A]"
        >
          {isDispute
            ? "Report a problem with this consultation?"
            : "Cancel this appointment?"}
        </h2>
        <p className="mt-2 text-[14px] leading-5 text-[#475569]">
          {consultationLabel ? `${consultationLabel}. ` : ""}
          {isDispute
            ? "Swift HELP will look at it and come back to you."
            : "This cannot be undone."}
        </p>

        {isDispute ? (
          <div className="mt-4 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-3">
            <p className="text-[13px] font-semibold leading-5 text-[#1565C0]">
              What happens to the payment
            </p>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-[#334155]">
              <li>
                Nothing moves while it is reviewed. The payment is held where
                it is.
              </li>
              <li>
                A refund or a payout after a consultation has taken place is
                decided by Swift HELP, not by this form.
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-3">
            <p className="text-[13px] font-semibold leading-5 text-[#B91C1C]">
              What happens to the payment
            </p>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-[#7F1D1D]">
              <li>
                {amount
                  ? `The full ${amount} goes back to the patient.`
                  : "The patient is refunded in full."}
              </li>
              <li>
                {actor === "professional"
                  ? "You earn nothing from this appointment, and no commission is charged."
                  : "The professional earns nothing from this appointment."}
              </li>
            </ul>
          </div>
        )}

        <fieldset className="mt-4">
          <legend className="text-[13px] font-semibold text-[#334155]">
            {isDispute ? "What went wrong?" : "Why are you cancelling?"}
          </legend>
          <div className="mt-2 space-y-2">
            {REASONS[isDispute ? "dispute" : "cancel"][actor].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-2 text-[14px] leading-5 text-[#334155]"
              >
                <input
                  type="radio"
                  name="cancellation-reason"
                  value={option}
                  checked={choice === option}
                  onChange={() => setChoice(option)}
                  className="mt-0.5 h-4 w-4 accent-[#1565C0]"
                />
                {option}
              </label>
            ))}
          </div>
          {isOther ? (
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder={
                isDispute
                  ? "Tell us briefly what happened."
                  : "Tell us briefly why."
              }
              className="mt-2 w-full rounded-[8px] border border-[#CBD5E1] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#DBEAFE]"
            />
          ) : null}
        </fieldset>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          {/* The safe choice first in the source and visually dominant: a
              mistaken press should keep the appointment, not end it. A
              dispute moves no money, so there its confirm is the plain one. */}
          <button
            type="button"
            onClick={onKeep}
            disabled={busy}
            className={
              isDispute
                ? "h-11 w-full rounded-[10px] border border-[#CBD5E1] px-4 text-[15px] font-semibold text-[#334155] transition hover:bg-[#F1F5F9] disabled:opacity-60 sm:flex-1"
                : "h-11 w-full rounded-[10px] bg-[#1565C0] px-4 text-[15px] font-semibold text-white transition hover:bg-[#0D47A1] disabled:opacity-60 sm:flex-1"
            }
          >
            {isDispute ? "Never mind" : "Keep appointment"}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={!canConfirm}
            className={
              isDispute
                ? "h-11 w-full rounded-[10px] bg-[#1565C0] px-4 text-[15px] font-semibold text-white transition hover:bg-[#0D47A1] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                : "h-11 w-full rounded-[10px] border border-[#DC2626] px-4 text-[15px] font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
            }
          >
            {busy
              ? isDispute
                ? "Sending..."
                : "Cancelling..."
              : isDispute
                ? "Send for review"
                : "Confirm cancellation"}
          </button>
        </div>
        {reason.length === 0 ? (
          <p className="mt-2 text-center text-[12px] text-[#64748B]">
            {isDispute
              ? "Choose what went wrong to continue."
              : "Choose a reason to confirm."}
          </p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
