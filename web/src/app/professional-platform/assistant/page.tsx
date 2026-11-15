"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getProfessionalAssistantAvailability,
  sendProfessionalAssistantMessage,
  startProfessionalAssistantSession,
  type ProfessionalAssistantMessage,
} from "@/services/professionalApi";
import { useVoice } from "./useVoice";

export default function ProfessionalAssistantPage() {
  const router = useRouter();
  const voice = useVoice();

  const [available, setAvailable] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ProfessionalAssistantMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  /** Read replies aloud. Off by default - a clinic is not always private. */
  const [speakReplies, setSpeakReplies] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfessionalAssistantAvailability()
      .then(({ available: isAvailable }) => {
        if (cancelled) return;
        setAvailable(isAvailable);
        if (!isAvailable) return;
        return startProfessionalAssistantSession().then((result) => {
          if (cancelled) return;
          setSessionId(result.session.id);
          setMessages(result.messages ?? []);
        });
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Dictated text lands in the box so it can be corrected before sending,
  // rather than being sent the moment the microphone mishears something.
  useEffect(() => {
    if (voice.transcript) setDraft(voice.transcript);
  }, [voice.transcript]);

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || !sessionId || sending) return;

      setSending(true);
      setDraft("");
      voice.clearTranscript();

      try {
        const result = await sendProfessionalAssistantMessage(sessionId, body);
        setMessages(result.messages ?? []);
        setSuggestions(result.suggestions ?? []);
        if (speakReplies && result.reply?.body) {
          voice.speak(result.reply.body);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "The assistant could not answer just now",
        );
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending, speakReplies, voice],
  );

  if (available === null) {
    return (
      <div className="rounded-[14px] border border-[#DDE6F0] bg-white p-6 text-[#94A3B8]">
        Loading your assistant...
      </div>
    );
  }

  if (!available) {
    return (
      <section className="rounded-[14px] border border-dashed border-[#C9D7E6] bg-white p-8">
        <h2 className="text-[20px] font-semibold text-[#334155]">
          Practice assistant
        </h2>
        <p className="mt-2 max-w-[620px] text-[15px] leading-6 text-[#64748B]">
          The assistant is part of the Pro plan. It helps with your schedule,
          your bookings, your earnings and drafting your own notes, and you
          can speak to it rather than type. It does not advise on clinical
          decisions.
        </p>
        <button
          type="button"
          onClick={() =>
            router.push("/professional-platform/settings?tab=subscription")
          }
          className="mt-5 rounded-[10px] bg-[#1565C0] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0F4C94]"
        >
          See the Pro plan
        </button>
      </section>
    );
  }

  return (
    <section className="flex min-h-[560px] flex-col rounded-[14px] border border-[#DDE6F0] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F7] px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold text-[#334155]">
            Practice assistant
          </h2>
          <p className="mt-0.5 text-[13px] text-[#94A3B8]">
            Schedule, bookings, earnings and your own notes. Not for clinical
            decisions.
          </p>
        </div>

        {voice.supported.output ? (
          <label className="flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
            <input
              type="checkbox"
              checked={speakReplies}
              onChange={(event) => {
                setSpeakReplies(event.target.checked);
                if (!event.target.checked) voice.stopSpeaking();
              }}
              className="h-4 w-4 accent-[#1565C0]"
            />
            Read replies aloud
          </label>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((message) => {
          const mine = message.sender === "professional";
          return (
            <div
              key={message.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-[14px] px-4 py-3 text-[14px] leading-5 ${
                  mine
                    ? "bg-[#1565C0] text-white"
                    : "bg-[#F8FAFC] text-[#334155]"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                {message.source === "fallback" ? (
                  <p className="mt-2 text-[11px] italic text-[#94A3B8]">
                    Answered from your own records - the assistant service was
                    unreachable.
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
        {sending ? (
          <p className="text-[13px] text-[#94A3B8]">Thinking...</p>
        ) : null}
        <div ref={endRef} />
      </div>

      {suggestions.length ? (
        <div className="flex flex-wrap gap-2 border-t border-[#EEF2F7] px-5 py-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              disabled={sending}
              className="rounded-full border border-[#DDE6F0] px-3 py-1.5 text-[13px] text-[#64748B] transition hover:border-[#1565C0] hover:text-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
        className="border-t border-[#EEF2F7] px-5 py-4"
      >
        <p className="mb-2 text-[12px] leading-4 text-[#94A3B8]">
          Do not enter patient-identifiable information. Messages are sent to
          OpenAI to generate a reply, and dictation is transcribed by your
          browser&apos;s speech service, which on Chrome and Safari means the
          audio is sent to Google or Apple.
        </p>

        {voice.error ? (
          <p className="mb-2 text-[13px] text-[#B45309]">{voice.error}</p>
        ) : null}

        <div className="flex items-end gap-2">
          {voice.supported.input ? (
            <button
              type="button"
              onClick={() =>
                voice.listening ? voice.stopListening() : voice.startListening()
              }
              aria-label={voice.listening ? "Stop dictating" : "Dictate"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                voice.listening
                  ? "border-[#B45309] bg-[#FFFBEB] text-[#B45309]"
                  : "border-[#DDE6F0] text-[#64748B] hover:border-[#1565C0] hover:text-[#1565C0]"
              }`}
            >
              {voice.listening ? "..." : "Mic"}
            </button>
          ) : null}

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            placeholder={
              voice.listening
                ? "Listening..."
                : "Ask about your schedule, bookings or earnings"
            }
            className="min-h-[46px] flex-1 resize-none rounded-[10px] border border-[#DDE6F0] px-3 py-2.5 text-[14px] text-[#334155] outline-none focus:border-[#1565C0]"
          />

          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="h-11 shrink-0 rounded-[10px] bg-[#1565C0] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0F4C94] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>

        {!voice.supported.input ? (
          <p className="mt-2 text-[12px] text-[#94A3B8]">
            Dictation is not available in this browser. Chrome or Edge supports
            it.
          </p>
        ) : null}

        {voice.listening ? (
          <p className="mt-2 text-[12px] font-medium text-[#B45309]">
            Listening. Your browser is sending this audio to its speech
            service to transcribe.
          </p>
        ) : null}
      </form>
    </section>
  );
}
