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
  rememberConsultation({
    returnHref: next.returnHref,
    label: next.label,
    startedAt: next.startedAt,
    rememberedAt: Date.now(),
  });
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
  // Ending is deliberate, so there is nothing to come back to.
  forgetRememberedConsultation();
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

/* ----------------------------------------------------------------------- */

/**
 * A note that a consultation was in progress, kept where a refresh cannot
 * reach it.
 *
 * Refreshing destroys the page's JavaScript and the call with it - no
 * arrangement of components survives that. What can survive is the knowledge
 * that a consultation was running, so the person is offered their way back
 * instead of being left to find the appointment again.
 *
 * Session storage, not local storage: it belongs to this tab and this
 * sitting. Closing the tab ends it, which is the right default for something
 * that names a patient's consultation.
 */

const REMEMBERED_KEY = "swifthelp.consultation.inProgress";

/**
 * A backstop, not the real consultation window. The marker is cleared
 * properly when the call ends; this only stops a forgotten one lingering for
 * ever if that never happens.
 */
const REMEMBERED_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type RememberedConsultation = {
  returnHref: string;
  label: string;
  /** When the call was joined, so the duration does not restart. */
  startedAt: number;
  /** When this note was written, for the backstop above. */
  rememberedAt: number;
};

/**
 * Cached so the snapshot is the same object between announcements.
 *
 * React compares snapshots by identity, and re-reading storage would hand it
 * a fresh object every render and spin.
 */
let rememberedCache: RememberedConsultation | null = null;
let rememberedCacheLoaded = false;

/** The remembered consultation, for a component to subscribe to. */
export function getRememberedConsultationSnapshot() {
  if (!rememberedCacheLoaded) {
    rememberedCache = readRememberedConsultation();
    rememberedCacheLoaded = true;
  }
  return rememberedCache;
}

export function rememberConsultation(entry: RememberedConsultation) {
  rememberedCache = entry;
  rememberedCacheLoaded = true;
  try {
    window.sessionStorage.setItem(REMEMBERED_KEY, JSON.stringify(entry));
  } catch {
    // Private browsing, or storage refused. The call still works; only the
    // offer to rejoin after a refresh is lost.
  }
}

export function readRememberedConsultation(): RememberedConsultation | null {
  try {
    const raw = window.sessionStorage.getItem(REMEMBERED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedConsultation>;
    if (
      typeof parsed?.returnHref !== "string" ||
      typeof parsed?.startedAt !== "number" ||
      typeof parsed?.rememberedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.rememberedAt > REMEMBERED_MAX_AGE_MS) {
      forgetRememberedConsultation();
      return null;
    }
    return {
      returnHref: parsed.returnHref,
      label: typeof parsed.label === "string" ? parsed.label : "Consultation",
      startedAt: parsed.startedAt,
      rememberedAt: parsed.rememberedAt,
    };
  } catch {
    return null;
  }
}

export function forgetRememberedConsultation() {
  rememberedCache = null;
  rememberedCacheLoaded = true;
  announce();
  try {
    window.sessionStorage.removeItem(REMEMBERED_KEY);
  } catch {
    // Nothing useful to do, and nothing depends on it succeeding.
  }
}
