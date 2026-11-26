"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  endConsultationCallSession,
  getConsultationCallSession,
  subscribeToConsultationCall,
  type ConsultationCallSession,
} from "./consultationCallSession";

/**
 * Keeps a consultation running while the person is somewhere else.
 *
 * Mounted in the platform layout, above the router, so it is not unmounted by
 * navigation. It does two things the consultation page can no longer do once
 * that page is closed: it plays the other participant's audio, and it offers
 * a way back.
 *
 * The floating video window is the next step. This is the part that makes
 * leaving the page survivable at all - without an audio sink outside the
 * page, a call that stays joined still goes silent.
 */

type RemoteAudio = { id: string; track: MediaStreamTrack };

function readRemoteAudioTracks(session: ConsultationCallSession | null) {
  if (!session) return [] as RemoteAudio[];
  let participants: Record<string, unknown> = {};
  try {
    participants = session.call.participants() ?? {};
  } catch {
    // The call object can be mid-teardown. Silence is the right answer.
    return [] as RemoteAudio[];
  }

  const tracks: RemoteAudio[] = [];
  for (const [id, value] of Object.entries(participants)) {
    if (id === "local") continue;
    const participant = value as {
      tracks?: { audio?: { persistentTrack?: MediaStreamTrack; track?: MediaStreamTrack; state?: string } };
      audioTrack?: MediaStreamTrack | false;
    };
    const candidate =
      participant?.tracks?.audio?.persistentTrack ??
      participant?.tracks?.audio?.track ??
      (participant?.audioTrack || null);
    if (candidate) tracks.push({ id, track: candidate });
  }
  return tracks;
}

function HostedAudio({ track }: { track: MediaStreamTrack }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.srcObject = new MediaStream([track]);
    // Autoplay can be refused where the person has not interacted with this
    // page yet. They were in a call a moment ago, so a refusal is rare and
    // recoverable the moment they touch anything.
    void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [track]);

  return <audio ref={ref} autoPlay playsInline />;
}

function formatDuration(startedAt: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes % 60)}:${pad(seconds % 60)}`
    : `${minutes}:${pad(seconds % 60)}`;
}

export function ConsultationCallHost() {
  const session = useSyncExternalStore(
    subscribeToConsultationCall,
    getConsultationCallSession,
    () => null,
  );
  const pathname = usePathname();
  const [audioTracks, setAudioTracks] = useState<RemoteAudio[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);

  // Follows the call's own events rather than polling, so a participant
  // joining or unmuting is heard straight away.
  useEffect(() => {
    if (!session) {
      setAudioTracks([]);
      return;
    }
    const sync = () => setAudioTracks(readRemoteAudioTracks(session));
    sync();

    const events = [
      "participant-joined",
      "participant-updated",
      "participant-left",
      "track-started",
      "track-stopped",
    ];
    for (const event of events) {
      session.call.on(event, sync as never);
    }
    return () => {
      for (const event of events) {
        session.call.off(event, sync as never);
      }
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session]);

  if (!session) return null;

  // The consultation page renders its own call, so the bar would only be in
  // the way there.
  const onConsultationPage = session.returnHref.split("?")[0] === pathname;

  return (
    <>
      {audioTracks.map((entry) => (
        <HostedAudio key={entry.id} track={entry.track} />
      ))}

      {onConsultationPage ? null : (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:left-auto sm:right-4 sm:w-[360px] sm:px-0">
          <div className="flex items-center gap-3 rounded-[12px] bg-[#0F172A] px-4 py-3 shadow-xl">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {session.label}
              </p>
              <p className="text-[12px] leading-4 text-[#94A3B8]">
                In progress - {formatDuration(session.startedAt, now)}
              </p>
            </div>
            <Link
              href={session.returnHref}
              className="shrink-0 rounded-[8px] bg-[#1565C0] px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0D47A1]"
            >
              Return
            </Link>
            <button
              type="button"
              onClick={async () => {
                setEnding(true);
                try {
                  await endConsultationCallSession();
                } finally {
                  setEnding(false);
                }
              }}
              disabled={ending}
              className="shrink-0 rounded-[8px] border border-[#F87171] px-3 py-2 text-[13px] font-semibold text-[#FCA5A5] transition hover:bg-[#7F1D1D] disabled:opacity-60"
            >
              {ending ? "Ending..." : "End"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
