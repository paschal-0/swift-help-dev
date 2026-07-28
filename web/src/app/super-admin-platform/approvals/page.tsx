"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services/authApi";
import {
  listAdminPendingVerifications,
  reviewAdminOrganizationVerification,
  reviewAdminProfessionalVerification,
  type AdminPendingVerifications,
  type AdminVerificationAccount,
  type AdminVerificationStatus,
} from "@/services/adminApi";
import { useSuperAdminShell } from "../components/SuperAdminPlatformShell";

type AccountKind = "professional" | "organization";

type Tab = AccountKind;

const emptyQueue: AdminPendingVerifications = {
  professionals: [],
  organizations: [],
  total: 0,
};

const statusFilters: Array<{ value: AdminVerificationStatus; label: string }> = [
  { value: "pending", label: "Waiting for review" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function accountName(account: AdminVerificationAccount, kind: AccountKind) {
  if (kind === "professional") {
    return (
      account.professionalName?.trim() ||
      account.user?.fullName?.trim() ||
      "Professional"
    );
  }
  return (
    account.organisationName?.trim() ||
    account.user?.fullName?.trim() ||
    "Organisation"
  );
}

function statusChipClass(status: AdminVerificationStatus) {
  if (status === "approved") return "bg-[#D9F8DE] text-[#0D8C24]";
  if (status === "rejected" || status === "suspended") {
    return "bg-[#FEE2E2] text-[#B91C1C]";
  }
  if (status === "under_review") return "bg-[#FEF3C7] text-[#B45309]";
  return "bg-[#E3F2FD] text-[#1565C0]";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value?.trim()) return null;
  return (
    <p className="text-[13px] leading-5 text-[#64748B]">
      <span className="font-medium text-[#334155]">{label}</span> {value}
    </p>
  );
}

export default function SuperAdminApprovalsPage() {
  const { searchText } = useSuperAdminShell();
  const [queue, setQueue] = useState<AdminPendingVerifications>(emptyQueue);
  const [status, setStatus] = useState<AdminVerificationStatus>("pending");
  const [tab, setTab] = useState<Tab>("professional");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<{
    account: AdminVerificationAccount;
    kind: AccountKind;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQueue(await listAdminPendingVerifications(status));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setQueue(emptyQueue);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (
    account: AdminVerificationAccount,
    kind: AccountKind,
    nextStatus: AdminVerificationStatus,
    reason?: string,
  ) => {
    setBusyId(account.id);
    try {
      const send =
        kind === "professional"
          ? reviewAdminProfessionalVerification
          : reviewAdminOrganizationVerification;
      await send(account.id, {
        status: nextStatus,
        ...(reason?.trim() ? { rejectionReason: reason.trim() } : {}),
        ...(reason?.trim() ? { notes: reason.trim() } : {}),
      });

      const name = accountName(account, kind);
      toast.success(
        nextStatus === "approved"
          ? `${name} can now use the platform.`
          : nextStatus === "rejected"
            ? `${name} was rejected and cannot use the platform.`
            : `${name} was updated.`,
      );
      setRejectFor(null);
      setRejectReason("");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(() => {
    const list =
      tab === "professional" ? queue.professionals : queue.organizations;
    const query = searchText.trim().toLowerCase();
    if (!query) return list;

    return list.filter((account) =>
      [
        accountName(account, tab),
        account.user?.email,
        account.specialization,
        account.organisationType,
        account.licenseNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [queue, searchText, tab]);

  const tabs: Array<{ value: Tab; label: string; count: number }> = [
    {
      value: "professional",
      label: "Professionals",
      count: queue.professionals.length,
    },
    {
      value: "organization",
      label: "Organisations",
      count: queue.organizations.length,
    },
  ];

  return (
    <section className="pb-10">
      <header className="mb-5">
        <h1 className="text-[26px] font-semibold text-[#334155]">Approvals</h1>
        <p className="mt-1 max-w-[760px] text-[14px] leading-6 text-[#64748B]">
          Professionals and organisations cannot take consultations, accept
          shifts or be found by patients until you approve them here. Rejecting
          an account keeps it off the platform, and the reason you give is shown
          to them on their verification page.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-[22px] px-4 text-[14px] font-medium transition ${
                tab === item.value
                  ? "bg-[#1565C0] text-white"
                  : "border border-[#DDE5EF] bg-[#F8FAFC] text-[#334155] hover:bg-white"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[12px] ${
                  tab === item.value
                    ? "bg-white/20 text-white"
                    : "bg-[#E3F2FD] text-[#1565C0]"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#64748B]">Showing</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdminVerificationStatus)
            }
            className="h-10 min-w-[180px] cursor-pointer rounded-[10px] border border-[#CBD5E1] bg-white px-3 text-[13px] font-medium text-[#334155] outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#B9D7F4]"
          >
            {statusFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="rounded-[12px] bg-[#F8FAFC] px-5 py-10 text-center text-[14px] text-[#64748B]">
          Loading accounts...
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-[#CBD5E1] bg-white px-5 py-12 text-center text-[14px] text-[#64748B]">
          {status === "pending"
            ? "Nothing is waiting for review."
            : "No accounts match this filter."}
        </p>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {visible.map((account) => {
            const name = accountName(account, tab);
            const documents = account.uploadedDocuments ?? [];
            const busy = busyId === account.id;

            return (
              <li
                key={account.id}
                className="rounded-[14px] border border-[#E2EDF8] bg-white p-5 shadow-[0_8px_20px_rgba(148,163,184,0.10)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[17px] font-semibold text-[#334155]">
                      {name}
                    </h2>
                    <p className="truncate text-[13px] text-[#64748B]">
                      {account.user?.email ?? "No email on file"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-semibold ${statusChipClass(account.verificationStatus)}`}
                  >
                    {account.verificationStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {tab === "professional" ? (
                    <>
                      <DetailRow
                        label="Speciality:"
                        value={account.specialization}
                      />
                      <DetailRow
                        label="Licence:"
                        value={account.licenseNumber}
                      />
                      <DetailRow
                        label="Practice:"
                        value={account.primaryPracticeLocation}
                      />
                    </>
                  ) : (
                    <>
                      <DetailRow
                        label="Type:"
                        value={account.organisationType}
                      />
                      <DetailRow
                        label="Contact:"
                        value={account.companyEmail}
                      />
                      <DetailRow
                        label="Address:"
                        value={account.facilityAddress ?? account.address}
                      />
                    </>
                  )}
                  <DetailRow
                    label="Signed up:"
                    value={formatDate(account.user?.createdAt ?? account.createdAt)}
                  />
                </div>

                {tab === "professional" ? (
                  <div className="mt-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#94A3B8]">
                      Documents ({documents.length})
                    </p>
                    {documents.length ? (
                      <ul className="mt-1 space-y-1">
                        {documents.map((document, index) => (
                          <li
                            key={`${document.name ?? "document"}-${index}`}
                            className="text-[13px] text-[#334155]"
                          >
                            {document.url ? (
                              <a
                                href={document.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#1565C0] underline"
                              >
                                {document.name ?? `Document ${index + 1}`}
                              </a>
                            ) : (
                              (document.name ?? `Document ${index + 1}`)
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[13px] text-[#B45309]">
                        No documents uploaded yet.
                      </p>
                    )}
                  </div>
                ) : null}

                {account.verificationNotes?.trim() ? (
                  <p className="mt-3 rounded-[10px] bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#64748B]">
                    <span className="font-medium text-[#334155]">
                      Previous note:
                    </span>{" "}
                    {account.verificationNotes}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || account.verificationStatus === "approved"}
                    onClick={() => void review(account, tab, "approved")}
                    className="h-10 min-w-[120px] cursor-pointer rounded-[10px] bg-[#0D8C24] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0b7a1f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRejectFor({ account, kind: tab });
                      setRejectReason("");
                    }}
                    className="h-10 min-w-[120px] cursor-pointer rounded-[10px] border border-[#B91C1C] px-4 text-[14px] font-semibold text-[#B91C1C] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                  {account.verificationStatus !== "under_review" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void review(account, tab, "under_review")}
                      className="h-10 cursor-pointer rounded-[10px] border border-[#CBD5E1] px-4 text-[14px] font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark under review
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {rejectFor ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#334155]/45 px-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setRejectFor(null)}
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-[520px] rounded-[16px] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.26)]"
          >
            <h2 className="text-[18px] font-semibold text-[#334155]">
              Reject {accountName(rejectFor.account, rejectFor.kind)}?
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
              They will not be able to take consultations or be found by
              patients. Tell them what to fix so they can submit again.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="For example: the practising licence has expired, please upload a current one."
              className="mt-3 min-h-[96px] w-full rounded-[10px] border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#334155] outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#B9D7F4]"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectFor(null)}
                className="h-10 min-w-[110px] cursor-pointer rounded-[10px] border border-[#CBD5E1] text-[14px] font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || busyId === rejectFor.account.id}
                onClick={() =>
                  void review(
                    rejectFor.account,
                    rejectFor.kind,
                    "rejected",
                    rejectReason,
                  )
                }
                className="h-10 min-w-[140px] cursor-pointer rounded-[10px] bg-[#B91C1C] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyId === rejectFor.account.id
                  ? "Rejecting..."
                  : "Reject account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
