"use client";

import { useState } from "react";
import { RichText } from "./RichText";

type Props = {
  kind: "lectura" | "compatibilidad" | "carta";
  personId: string;
  otherId?: string;
  chartId?: string;
  initial: string | null;
  title: string;
  description: string;
  button: string;
  enabled: boolean;
};

export function NumerologyReading({ kind, personId, otherId, chartId, initial, title, description, button, enabled }: Props) {
  const [text, setText] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const res = await fetch("/api/numerologia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, personId, otherId, chartId }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "No se ha podido generar la lectura.");
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
          setText("");
          return;
        }
        setText(acc);
      }
    } catch {
      setError("Se ha perdido la conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!text && !loading && (
        <>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
          {enabled ? (
            <button type="button" className="btn btn-primary" onClick={generate}>
              {button}
            </button>
          ) : (
            <p className="muted small">Las lecturas se activarán muy pronto.</p>
          )}
        </>
      )}
      {loading && !text && <p className="muted">Alshain está leyendo los números. Tardará uno o dos minutos; puedes ir leyendo mientras se escribe.</p>}
      {text && <RichText text={text} />}
      {loading && text && (
        <p className="small muted" aria-live="polite">
          Alshain sigue escribiendo…
        </p>
      )}
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {text && !loading && (
        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          Lectura orientativa, generada con inteligencia artificial a partir de los cálculos numerológicos.
        </p>
      )}
    </div>
  );
}
