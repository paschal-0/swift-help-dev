"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  closeAdminSupportRequest,
  listAdminSupportRequests,
  respondToAdminSupportRequest,
  type AdminSupportRequest,
} from "@/services/adminApi";
import { getApiErrorMessage } from "@/services/authApi";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "Being looked at" },
  { id: "answered", label: "Answered" },
  { id: "closed", label: "Closed" },
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

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<AdminSupportRequest[]>([]);
  const [filter, setFilter] = useState("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests((await listAdminSupportRequests(filter)) ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const respond = async (id: string) => {
    if (!reply.trim()) return;
    setBusy(id);
    try {
      await respondToAdminSupportRequest(id, reply.trim());
      toast.success("Sent. The professional has been notified.");
      setReply("");
      setOpenId(null);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const close = async (id: string) => {
    setBusy(id);
    try {
      await closeAdminSupportRequest(id);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const overdueCount = requests.filter((request) => request.overdue).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-semibold text-[#334155]">
          Support queue
        </h1>
        <p className="mt-1 max-w-[720px] text-[14px] leading-5 text-[#64748B]">
          Priority requests come first - that is what the Pro plan buys, so the
          order here is the benefit. Anything past the response time promised
          when it was raised is flagged.
        </p>
      </header>

      {overdueCount > 0 ? (
        <div className="rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 text-[14px] font-medium text-[#92400E]">
          {overdueCount} request{overdueCount === 1 ? " is" : "s are"} past the
          response time we promised.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
              filter === option.id
                ? "bg-[#1565C0] text-white"
                : "border border-[#DDE6F0] text-[#64748B] hover:border-[#1565C0] hover:text-[#1565C0]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6 text-[#94A3B8]">
          Loading the queue...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#C9D7E6] bg-white p-6 text-[14px] text-[#94A3B8]">
          Nothing here.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className={`rounded-[14px] border bg-white p-5 ${
                request.overdue
                  ? "border-[#FDE68A]"
                  : request.priority === "priority"
                    ? "border-[#1565C0]"
                    : "border-[#DDE6F0]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-[#334155]">
                      {request.subject}
                    </h3>
                    {request.priority === "priority" ? (
                      <span className="rounded-full bg-[#1565C0] px-2 py-0.5 text-[11px] font-semibold text-white">
                        Priority
                      </span>
                    ) : null}
                    {request.overdue ? (
                      <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#92400E]">
                        Overdue
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] text-[#94A3B8]">
                    {request.requesterRole} - raised{" "}
                    {formatDateTime(request.createdAt)}
                    {request.respondByAt && !request.firstRespondedAt
                      ? ` - reply due ${formatDateTime(request.respondByAt)}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-[#EEF2F7] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#64748B]">
                  {request.status.replace(/_/g, " ")}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap break-words rounded-[10px] bg-[#F8FAFC] px-4 py-3 text-[14px] leading-5 text-[#334155]">
                {request.body}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpenId(openId === request.id ? null : request.id)
                  }
                  disabled={busy !== null}
                  className="rounded-[10px] bg-[#1565C0] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openId === request.id ? "Cancel" : "Reply"}
                </button>
                {request.status !== "closed" ? (
                  <button
                    type="button"
                    onClick={() => close(request.id)}
                    disabled={busy !== null}
                    className="rounded-[10px] border border-[#DDE6F0] px-4 py-2 text-[13px] font-semibold text-[#64748B] transition hover:text-[#334155] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Close
                  </button>
                ) : null}
              </div>

              {openId === request.id ? (
                <div className="mt-3">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={3}
                    placeholder="Your reply to the professional"
                    className="w-full resize-none rounded-[10px] border border-[#DDE6F0] px-3 py-2.5 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
                  />
                  <button
                    type="button"
                    onClick={() => respond(request.id)}
                    disabled={busy !== null || !reply.trim()}
                    className="mt-2 rounded-[10px] bg-[#1565C0] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === request.id ? "Sending..." : "Send reply"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
