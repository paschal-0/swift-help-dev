"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  getConsultationCallSession,
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

  if (!session) return null;

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
