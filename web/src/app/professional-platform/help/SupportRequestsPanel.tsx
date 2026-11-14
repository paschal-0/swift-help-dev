"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createProfessionalSupportRequest,
  getProfessionalSupportEntitlement,
  getProfessionalSupportRequest,
  listProfessionalSupportRequests,
  replyToProfessionalSupportRequest,
  type SupportRequestMessageItem,
  type SupportRequestSummary,
} from "@/services/professionalApi";

const CATEGORIES = [
  { id: "account", label: "My account" },
  { id: "payments", label: "Payments and payouts" },
  { id: "bookings", label: "Bookings and consultations" },
  { id: "technical", label: "Something is broken" },
  { id: "other", label: "Something else" },
];

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "Being looked at",
  answered: "Answered",
  closed: "Closed",
};

export default function SupportRequestsPanel() {
  const [entitlement, setEntitlement] = useState<{
    priority: boolean;
    responseHours: number;
  } | null>(null);
  const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportRequestMessageItem[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("other");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [summary, list] = await Promise.all([
        getProfessionalSupportEntitlement(),
        listProfessionalSupportRequests(),
      ]);
      setEntitlement(summary);
      setRequests(list ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load support",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRequest = async (id: string) => {
    try {
      const detail = await getProfessionalSupportRequest(id);
      setOpenId(id);
      setThread(detail.messages ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open that request",
      );
    }
  };

  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and tell us what is wrong.");
      return;
    }
    setBusy(true);
    try {
      const result = await createProfessionalSupportRequest({
        subject: subject.trim(),
        body: body.trim(),
        category,
      });
      toast.success(
        `Raised. We aim to reply within ${result.responseHours} hours.`,
      );
      setSubject("");
      setBody("");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to raise that request",
      );
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!openId || !reply.trim()) return;
    setBusy(true);
    try {
      await replyToProfessionalSupportRequest(openId, reply.trim());
      setReply("");
      await openRequest(openId);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to send that reply",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {entitlement ? (
        <div
          className={`rounded-[14px] border p-5 ${
            entitlement.priority
              ? "border-[#1565C0] bg-[#EFF6FF]"
              : "border-[#DDE6F0] bg-white"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#334155]">
                {entitlement.priority
                  ? "You have priority support"
                  : "Standard support"}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
                We aim to reply within{" "}
                <span className="font-semibold">
                  {entitlement.responseHours} hours
                </span>
                {entitlement.priority
                  ? ", and your requests are answered before standard ones."
                  : ". The Pro plan shortens this and moves your requests to the front of the queue."}
              </p>
            </div>
            {entitlement.priority ? (
              <span className="rounded-full bg-[#1565C0] px-3 py-1 text-[12px] font-semibold text-white">
                Priority
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-5">
        <h3 className="text-[16px] font-semibold text-[#334155]">
          Raise a request
        </h3>

        <div className="mt-4 space-y-3">
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={180}
            placeholder="What is this about?"
            className="w-full rounded-[10px] border border-[#DDE6F0] px-3 py-2.5 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-[10px] border border-[#DDE6F0] px-3 py-2.5 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
          >
            {CATEGORIES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            placeholder="Tell us what happened, and what you expected instead."
            className="w-full resize-none rounded-[10px] border border-[#DDE6F0] px-3 py-2.5 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-[10px] bg-[#1565C0] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Sending..." : "Send request"}
          </button>
        </div>
      </div>

      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-5">
        <h3 className="text-[16px] font-semibold text-[#334155]">
          Your requests
        </h3>

        {requests.length ? (
          <div className="mt-4 space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-[12px] border border-[#EEF2F7]"
              >
                <button
                  type="button"
                  onClick={() =>
                    openId === request.id
                      ? setOpenId(null)
                      : void openRequest(request.id)
                  }
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-[#334155]">
                      {request.subject}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[#94A3B8]">
                      {formatDateTime(request.createdAt)}
                      {request.respondByAt && !request.firstRespondedAt
                        ? ` - reply due ${formatDateTime(request.respondByAt)}`
                        : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {request.priority === "priority" ? (
                      <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1565C0]">
                        Priority
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[#EEF2F7] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                      {STATUS_LABEL[request.status] ?? request.status}
                    </span>
                  </span>
                </button>

                {openId === request.id ? (
                  <div className="border-t border-[#EEF2F7] px-4 py-3">
                    <div className="space-y-2">
                      {thread.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-[10px] px-3 py-2 text-[13px] leading-5 ${
                            message.sender === "support"
                              ? "bg-[#EFF6FF] text-[#1E3A8A]"
                              : "bg-[#F8FAFC] text-[#334155]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                          <p className="mt-1 text-[11px] text-[#94A3B8]">
                            {message.sender === "support"
                              ? "Swift HELP support"
                              : "You"}{" "}
                            - {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {request.status !== "closed" ? (
                      <div className="mt-3 flex items-end gap-2">
                        <textarea
                          value={reply}
                          onChange={(event) => setReply(event.target.value)}
                          rows={2}
                          placeholder="Add to this request"
                          className="flex-1 resize-none rounded-[10px] border border-[#DDE6F0] px-3 py-2 text-[13px] text-[#334155] outline-none focus:border-[#1565C0]"
                        />
                        <button
                          type="button"
                          onClick={sendReply}
                          disabled={busy || !reply.trim()}
                          className="rounded-[10px] border border-[#1565C0] px-4 py-2 text-[13px] font-semibold text-[#1565C0] transition hover:bg-[#E3F2FD] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Send
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[12px] border border-dashed border-[#C9D7E6] p-5 text-[14px] text-[#94A3B8]">
            You have not raised anything yet.
          </div>
        )}
      </div>
    </div>
  );
}
