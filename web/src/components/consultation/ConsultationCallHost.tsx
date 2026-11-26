"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  forgetRememberedConsultation,
  getConsultationCallSession,
  getRememberedConsultationSnapshot,
  subscribeToConsultationCall,
  type ConsultationCallSession,
} from "./consultationCallSession";
import { ConsultationMiniWindow } from "./ConsultationMiniWindow";

/**
 * Keeps a consultation running while the person is somewhere else.
 *
 * Mounted in the platform layout, above the router, so it is not unmounted by
 * navigation. It owns the two things the consultation page can no longer do
 * once that page is closed: playing the other participant's audio, and
 * showing the floating window that carries the call around.
 *
 * The audio lives here rather than in the floating window because it must
 * keep playing wherever the person is - a call that stays joined with no
 * audio sink outside the page still goes silent.
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

export function ConsultationCallHost() {
  const session = useSyncExternalStore(
    subscribeToConsultationCall,
    getConsultationCallSession,
    () => null,
  );
  // Survives a refresh, which the call itself cannot: reloading destroys the
  // page's JavaScript and the connection with it. What is left is the
  // knowledge that a consultation was running, and a way back to it.
  const remembered = useSyncExternalStore(
    subscribeToConsultationCall,
    getRememberedConsultationSnapshot,
    () => null,
  );
  const pathname = usePathname();
  const [audioTracks, setAudioTracks] = useState<RemoteAudio[]>([]);

  // Follows the call's own events rather than polling, so a participant
  // joining or unmuting is heard straight away.
  useEffect(() => {
    // Nothing to clear when the session goes: the component renders nothing
    // without one, so the tracks it held are never shown again.
    if (!session) return;
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

  if (!session) {
    // No live call, but one was running before the page reloaded. The login
    // cookie survived too, so this is one tap back in rather than a fresh
    // sign-in and a hunt for the appointment.
    if (!remembered || remembered.returnHref.split("?")[0] === pathname) {
      return null;
    }
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:left-auto sm:right-4 sm:w-[340px] sm:px-0">
        <div className="flex items-center gap-3 rounded-[12px] bg-[#1E293B] px-4 py-3 shadow-xl">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">
              {remembered.label}
            </p>
            <p className="text-[12px] leading-4 text-[#94A3B8]">
              You were in this consultation
            </p>
          </div>
          <Link
            href={remembered.returnHref}
            className="shrink-0 rounded-[8px] bg-[#1565C0] px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0D47A1]"
          >
            Rejoin
          </Link>
          <button
            type="button"
            onClick={forgetRememberedConsultation}
            aria-label="Dismiss"
            className="shrink-0 rounded-[8px] px-2 py-2 text-[13px] font-semibold text-[#94A3B8] transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // The consultation page renders its own call, so the bar would only be in
  // the way there.
  const onConsultationPage = session.returnHref.split("?")[0] === pathname;

  return (
    <>
      {audioTracks.map((entry) => (
        <HostedAudio key={entry.id} track={entry.track} />
      ))}

      {/* The consultation page renders its own call, so the floating
          window would only be in the way there. */}
      {onConsultationPage ? null : (
        <ConsultationMiniWindow session={session} />
      )}
    </>
  );
}
