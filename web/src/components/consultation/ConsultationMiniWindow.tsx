"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  endConsultationCallSession,
  type ConsultationCallSession,
} from "./consultationCallSession";

/**
 * An ongoing consultation, carried around the rest of Swift HELP.
 *
 * Shown whenever the call is live and the consultation page is not open. It
 * is a second window onto the same call rather than a second call: the
 * session it reads from is the one the page uses, so nothing here joins,
 * leaves or duplicates anything.
 */

const WIDTH = 248;
const MARGIN = 16;

type MediaState = { audioEnabled: boolean; videoEnabled: boolean };

function readLocalMedia(session: ConsultationCallSession): MediaState {
  try {
    const local = session.call.participants()?.local as
      | { audio?: boolean; video?: boolean }
      | undefined;
    return {
      audioEnabled: Boolean(local?.audio),
      videoEnabled: Boolean(local?.video),
    };
  } catch {
    return { audioEnabled: false, videoEnabled: false };
  }
}

function readRemoteVideo(session: ConsultationCallSession) {
  try {
    const participants = session.call.participants() ?? {};
    for (const [id, value] of Object.entries(participants)) {
      if (id === "local") continue;
      const participant = value as {
        tracks?: {
          video?: {
            persistentTrack?: MediaStreamTrack;
            track?: MediaStreamTrack;
          };
        };
        videoTrack?: MediaStreamTrack | false;
      };
      const track =
        participant?.tracks?.video?.persistentTrack ??
        participant?.tracks?.video?.track ??
        (participant?.videoTrack || null);
      if (track) return track;
    }
  } catch {
    // Mid-teardown. The placeholder is the honest thing to show.
  }
  return null;
}

/**
 * Whether this browser can detach the video into its own floating window.
 *
 * Chrome, Edge and desktop Safari can; iOS Safari uses an older WebKit call
 * of its own; Firefox offers it only through its own controls, which is why
 * it is not claimed here. Asked rather than assumed, so a browser that
 * cannot do it is not offered a button that fails.
 */
type PipVideoElement = HTMLVideoElement & {
  webkitSetPresentationMode?: (mode: string) => void;
  webkitSupportsPresentationMode?: (mode: string) => boolean;
};

function supportsPictureInPicture(element: HTMLVideoElement | null) {
  if (!element) return false;
  const video = element as PipVideoElement;
  if (
    typeof document !== "undefined" &&
    document.pictureInPictureEnabled &&
    typeof video.requestPictureInPicture === "function"
  ) {
    return true;
  }
  return (
    typeof video.webkitSupportsPresentationMode === "function" &&
    video.webkitSupportsPresentationMode("picture-in-picture")
  );
}

async function togglePictureInPicture(element: HTMLVideoElement) {
  const video = element as PipVideoElement;
  if (
    typeof document !== "undefined" &&
    typeof video.requestPictureInPicture === "function"
  ) {
    if (document.pictureInPictureElement === video) {
      await document.exitPictureInPicture();
      return;
    }
    await video.requestPictureInPicture();
    return;
  }
  // The iOS route. It returns nothing and reports nothing, so there is no
  // state to read back - only the request.
  video.webkitSetPresentationMode?.("picture-in-picture");
}

function PipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M3 5h18v14H3z"
      />
      <path fill="currentColor" d="M12 12h8v5h-8z" />
    </svg>
  );
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

function MicrophoneIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
      />
      {muted ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M4 4l16 16"
        />
      ) : null}
    </svg>
  );
}

function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm14 3.5 4-2.5v10l-4-2.5Z"
      />
      {off ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M3 3l18 18"
        />
      ) : null}
    </svg>
  );
}

export function ConsultationMiniWindow({
  session,
}: {
  session: ConsultationCallSession;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [media, setMedia] = useState<MediaState>(() => readLocalMedia(session));
  const [remoteTrack, setRemoteTrack] = useState<MediaStreamTrack | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [pipAvailable, setPipAvailable] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  // Driven by the call's own events, so muting from the consultation page is
  // reflected here and the two sets of controls never disagree.
  useEffect(() => {
    const sync = () => {
      setMedia(readLocalMedia(session));
      setRemoteTrack(readRemoteVideo(session));
    };
    sync();
    const events = [
      "participant-joined",
      "participant-updated",
      "participant-left",
      "track-started",
      "track-stopped",
    ];
    for (const event of events) session.call.on(event, sync as never);
    return () => {
      for (const event of events) session.call.off(event, sync as never);
    };
  }, [session]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    if (!remoteTrack) {
      element.srcObject = null;
      return;
    }
    element.srcObject = new MediaStream([remoteTrack]);
    void element.play().catch(() => undefined);
    // Asked once there is something to detach: a video element with no
    // stream reports nothing useful.
    setPipAvailable(supportsPictureInPicture(element));
    return () => {
      element.srcObject = null;
    };
  }, [remoteTrack]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.parentElement?.getBoundingClientRect();
      if (!rect) return;
      dragRef.current = {
        dx: event.clientX - rect.left,
        dy: event.clientY - rect.top,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      // Clamped, so the window cannot be dragged somewhere it can never be
      // retrieved from.
      const maxX = window.innerWidth - WIDTH - MARGIN;
      const maxY = window.innerHeight - 160;
      setPosition({
        x: Math.min(
          Math.max(event.clientX - drag.dx, MARGIN),
          Math.max(maxX, MARGIN),
        ),
        y: Math.min(
          Math.max(event.clientY - drag.dy, MARGIN),
          Math.max(maxY, MARGIN),
        ),
      });
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const toggleMicrophone = () => {
    const next = !media.audioEnabled;
    session.call.setLocalAudio(next);
    setMedia((current) => ({ ...current, audioEnabled: next }));
  };

  const toggleCamera = () => {
    const next = !media.videoEnabled;
    session.call.setLocalVideo(next);
    setMedia((current) => ({ ...current, videoEnabled: next }));
  };

  const style = position
    ? { left: position.x, top: position.y, width: WIDTH }
    : { right: MARGIN, bottom: MARGIN, width: WIDTH };

  return (
    <div
      className="fixed z-[60] overflow-hidden rounded-[14px] bg-[#0F172A] shadow-2xl"
      style={style}
      role="complementary"
      aria-label="Ongoing consultation"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex cursor-grab touch-none items-center gap-2 px-3 py-2 active:cursor-grabbing"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white">
          {session.label}
        </p>
        <span className="shrink-0 text-[12px] tabular-nums text-[#94A3B8]">
          {formatDuration(session.startedAt, now)}
        </span>
      </div>

      <div className="relative aspect-video bg-black">
        {remoteTrack ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-[11px] leading-4 text-[#94A3B8]">
            Waiting for the other camera
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-2 py-2">
        <button
          type="button"
          onClick={toggleMicrophone}
          aria-label={
            media.audioEnabled ? "Mute microphone" : "Unmute microphone"
          }
          aria-pressed={!media.audioEnabled}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
            media.audioEnabled
              ? "bg-[#1E293B] text-white hover:bg-[#334155]"
              : "bg-[#7F1D1D] text-[#FCA5A5]"
          }`}
        >
          <MicrophoneIcon muted={!media.audioEnabled} />
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          aria-label={media.videoEnabled ? "Turn camera off" : "Turn camera on"}
          aria-pressed={!media.videoEnabled}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
            media.videoEnabled
              ? "bg-[#1E293B] text-white hover:bg-[#334155]"
              : "bg-[#7F1D1D] text-[#FCA5A5]"
          }`}
        >
          <CameraIcon off={!media.videoEnabled} />
        </button>

        {pipAvailable ? (
          <button
            type="button"
            // Hands the video to the browser's own floating player, which
            // keeps running over other apps and other tabs. Only offered
            // where the browser says it can.
            onClick={() => {
              const element = videoRef.current;
              if (element) void togglePictureInPicture(element).catch(() => undefined);
            }}
            aria-label="Pop out video"
            title="Pop out - stays on top of other windows"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1E293B] text-white transition hover:bg-[#334155]"
          >
            <PipIcon />
          </button>
        ) : null}

        <Link
          href={session.returnHref}
          className="ml-auto rounded-[8px] bg-[#1565C0] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#0D47A1]"
        >
          Expand
        </Link>
        <button
          type="button"
          onClick={() => setConfirmingEnd(true)}
          className="rounded-[8px] border border-[#F87171] px-2.5 py-1.5 text-[12px] font-semibold text-[#FCA5A5] transition hover:bg-[#7F1D1D]"
        >
          End
        </button>
      </div>

      {confirmingEnd ? (
        <div className="border-t border-[#1E293B] px-3 py-3">
          <p className="text-[12px] leading-4 text-white">
            End this consultation? This does not cancel the appointment.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingEnd(false)}
              className="flex-1 rounded-[8px] bg-[#1565C0] px-2 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#0D47A1]"
            >
              Keep going
            </button>
            <button
              type="button"
              disabled={ending}
              onClick={async () => {
                setEnding(true);
                try {
                  await endConsultationCallSession();
                } finally {
                  setEnding(false);
                  setConfirmingEnd(false);
                }
              }}
              className="flex-1 rounded-[8px] border border-[#F87171] px-2 py-1.5 text-[12px] font-semibold text-[#FCA5A5] transition hover:bg-[#7F1D1D] disabled:opacity-60"
            >
              {ending ? "Ending..." : "End call"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
