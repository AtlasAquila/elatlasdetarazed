"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EVENTO_VENUS, VENUS_PREGUNTA } from "@/lib/venus-retrogrado";
import { RichText } from "./RichText";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  chartId: string;
  chartName: string;
  initial: Msg[];
  remaining: number;
  isPremium: boolean;
  enabled: boolean;
  /** Llega desde la guía de Venus retrógrado: se destaca la pregunta sugerida. */
  suggestVenus?: boolean;
};

const SUGGESTIONS = ["¿Qué dice mi carta sobre mi forma de amar?", "¿Cuál es mi mayor talento según mi carta?", "¿Qué significa mi Luna para mi vida emocional?", "¿Hacia qué vocación apunta mi Medio Cielo?"];

export function AssistantChat({ chartId, chartName, initial, remaining: initialRemaining, isPremium, enabled, suggestVenus = false }: Props) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);

  const send = async (text: string, evento?: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setError(null);
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/asistente", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chartId, message: question, evento }) });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "No se ha podido enviar la pregunta.");
        setMessages((m) => m.slice(0, -2));
        setInput(question);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const errAt = acc.indexOf("[[ERROR]]");
        if (errAt >= 0) {
          setError(acc.slice(errAt + 9).trim());
          setMessages((m) => m.slice(0, -2));
          setInput(question);
          return;
        }
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
      setRemaining((r) => Math.max(0, r - 1));
    } catch {
      setError("Se ha perdido la conexión. Inténtalo de nuevo.");
      setMessages((m) => m.slice(0, -2));
      setInput(question);
    } finally {
      setBusy(false);
    }
  };

  const outOfQuestions = remaining <= 0;
  const showVenus = suggestVenus && enabled && !outOfQuestions && !messages.some((m) => m.content === VENUS_PREGUNTA);

  return (
    <div className="chat">
      <div className="chat-log" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="muted">Pregúntame lo que quieras sobre la carta de {chartName}. Recordaré lo que hablemos, aunque cierres la sesión.</p>
            <div className="toggles">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="toggle" onClick={() => send(s)} disabled={busy || outOfQuestions || !enabled}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-${m.role}`}>
            {m.role === "assistant" ? m.content ? <RichText text={m.content} /> : <p className="muted">Alshain está pensando…</p> : <p>{m.content}</p>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {showVenus && (
        <div className="chat-suggest">
          <p className="small muted">Viene de la guía de Venus retrógrado. Una pregunta para empezar:</p>
          <button type="button" className="btn btn-primary" onClick={() => send(VENUS_PREGUNTA, EVENTO_VENUS)} disabled={busy}>
            {VENUS_PREGUNTA}
          </button>
        </div>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      {!enabled ? (
        <p className="notice">El asistente se activará muy pronto.</p>
      ) : outOfQuestions ? (
        <div className="notice">
          {isPremium ? "Has usado tus mensajes de este mes. Se renuevan el día 1." : "Has usado tus 3 preguntas gratuitas."}{" "}
          {!isPremium && <Link href="/planes">Descubre Premium</Link>}
        </div>
      ) : (
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="chat-input" className="visually-hidden">
            Tu pregunta
          </label>
          <textarea
            id="chat-input"
            className="textarea"
            rows={2}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Escribe tu pregunta…"
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
            {busy ? "…" : "Enviar"}
          </button>
        </form>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        {remaining >= 9999 ? "Sin límite (administrador)." : isPremium ? `Te quedan ${remaining} mensajes este mes.` : `Te quedan ${remaining} de 3 preguntas gratuitas.`} Respuestas orientativas, generadas con inteligencia artificial.
      </p>
    </div>
  );
}
