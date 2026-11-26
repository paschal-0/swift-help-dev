/**
 * The live consultation call, held outside React's component tree.
 *
 * The call used to be created inside the consultation page's effect, so
 * navigating anywhere unmounted the page, ran the cleanup, and left and
 * destroyed the call. The other participant was then told you had gone. The
 * call could only live as long as the page that owned it.
 *
 * It lives here instead: a module-level value that no route change can
 * unmount. A page attaches to it while it is open and detaches when it
 * closes, and only an explicit end tears the call down.
 */

export type PersistentDailyCall = {
  leave: () => Promise<unknown>;
  destroy: () => Promise<unknown>;
  participants: () => Record<string, unknown>;
  setLocalAudio: (enabled: boolean) => unknown;
  setLocalVideo: (enabled: boolean) => unknown;
  on: (event: string, handler: (...args: never[]) => void) => unknown;
  off: (event: string, handler: (...args: never[]) => void) => unknown;
};

export type ConsultationCallSession = {
  /** Identifies the room. Joining a different one replaces this session. */
  meetingUrl: string;
  roomName: string | null;
  call: PersistentDailyCall;
  /** Local tracks opened before joining, stopped when the call ends. */
  prewarmedStream: MediaStream | null;
  /** Where "Return to consultation" goes. */
  returnHref: string;
  /** What to call it in the bar, e.g. "General Consultation". */
  label: string;
  /** When the call was joined, for a duration that survives navigation. */
  startedAt: number;
};

let session: ConsultationCallSession | null = null;
const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

export function subscribeToConsultationCall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConsultationCallSession() {
  return session;
}

/** The session for this room, or null if a different room is live. */
export function getConsultationCallSessionFor(meetingUrl: string) {
  return session?.meetingUrl === meetingUrl ? session : null;
}

export function startConsultationCallSession(next: ConsultationCallSession) {
  session = next;
  announce();
}

/**
 * Updates the parts a page knows and the store does not, without disturbing
 * the call itself.
 */
export function describeConsultationCallSession(
  patch: Partial<Pick<ConsultationCallSession, 'returnHref' | 'label'>>,
) {
  if (!session) return;
  session = { ...session, ...patch };
  announce();
}

/**
 * Ends the call for good.
 *
 * Only an explicit end reaches here - never an unmount - because leaving is
 * what tells the other participant you have gone.
 */
export async function endConsultationCallSession() {
  const ending = session;
  session = null;
  announce();
  if (!ending) return;

  try {
    await ending.call.leave();
  } catch {
    // Already gone. Destroying still has to happen.
  }
  try {
    await ending.call.destroy();
  } catch {
    // Nothing useful to do: the object is being discarded either way.
  }
  ending.prewarmedStream?.getTracks().forEach((track) => track.stop());
}

/**
 * Forgets the session without touching the call.
 *
 * For the case where the call object has already gone - a reload, or Daily
 * tearing itself down - and the store would otherwise point at something
 * dead.
 */
export function forgetConsultationCallSession() {
  session = null;
  announce();
}
