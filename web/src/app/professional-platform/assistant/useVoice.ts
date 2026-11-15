"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Speech in and out, using what the browser provides.
 *
 * This does NOT keep audio on the device. Chrome and Edge send microphone
 * audio to Google's speech service to transcribe it, and Safari sends it to
 * Apple's; only the returned text reaches Swift HELP. A clinician dictating
 * here is therefore sending that audio to a third party, which is why the
 * page says so plainly and warns against patient-identifiable detail.
 *
 * On-device transcription would need a model shipped to the browser or audio
 * uploaded to a provider we control. Both are real options; neither is this.
 *
 * Support is uneven - good in Chrome and Edge, partial in Safari, absent in
 * Firefox - so every caller must handle `supported` being false rather than
 * assuming a microphone is there.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionConstructor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function readTranscript(event: unknown): { text: string; final: boolean } {
  const results = (event as { results?: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal?: boolean }> })
    ?.results;
  if (!results) return { text: "", final: false };

  let text = "";
  let final = false;
  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    const alternative = result?.[0];
    if (alternative?.transcript) text += alternative.transcript;
    if (result?.isFinal) final = true;
  }
  return { text: text.trim(), final };
}


/** Capabilities are fixed for the life of the page, so there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};

const SERVER_VOICE_SUPPORT = { input: false, output: false };
let clientVoiceSupport: { input: boolean; output: boolean } | null = null;

/** Cached so the snapshot is referentially stable between renders. */
function getClientVoiceSupport() {
  if (!clientVoiceSupport) {
    clientVoiceSupport = {
      input: Boolean(getRecognitionConstructor()),
      output: typeof window !== "undefined" && "speechSynthesis" in window,
    };
  }
  return clientVoiceSupport;
}

function getServerVoiceSupport() {
  return SERVER_VOICE_SUPPORT;
}

export function useVoice(options: { lang?: string } = {}) {
  const lang = options.lang ?? "en-GB";
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // What the browser can do never changes while the page is open, and the
  // server cannot know it, so it is read as external state rather than
  // assigned in an effect - which would also hydrate mismatched.
  const supported = useSyncExternalStore(
    subscribeToNothing,
    getClientVoiceSupport,
    getServerVoiceSupport,
  );

  // Anything still running when the page closes would otherwise keep the
  // microphone open.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError(
        "This browser cannot listen. Chrome or Edge supports it, or you can type instead.",
      );
      return;
    }

    setError(null);
    setTranscript("");

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const { text } = readTranscript(event);
      if (text) setTranscript(text);
    };
    recognition.onerror = (event) => {
      const code = (event as { error?: string })?.error;
      setError(
        code === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser to dictate."
          : "Could not hear anything. Try again, or type instead.",
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start listening. Try again, or type instead.");
      setListening(false);
    }
  }, [lang]);

  /** Reads a reply aloud. Silently does nothing where unsupported. */
  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.02;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    speaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript: () => setTranscript(""),
  };
}
