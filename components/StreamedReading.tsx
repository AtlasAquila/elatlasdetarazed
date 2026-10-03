"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RichText } from "./RichText";

type Props = {
  endpoint: string;
  body?: Record<string, unknown>;
  initial: string | null;
  title?: string;
  description?: string;
  button: string;
  waiting: string;
  note?: string;
  enabled: boolean;
  /** Empieza sola al cargar (por ejemplo, justo después de anotar un sueño). */
  autoStart?: boolean;
  /** Muestra el texto guardado pero permite pedir uno nuevo (p. ej. patrones con sueños nuevos). */
  refreshLabel?: string;
  /** Recarga los datos de la página al terminar (símbolos extraídos, contadores). */
  refreshOnDone?: boolean;
};

export function StreamedReading({ endpoint, body, initial, title, description, button, waiting, note, enabled, autoStart, refreshLabel, refreshOnDone }: Props) {
  const [text, setText] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const router = useRouter();

  const generate = async () => {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "No se ha podido completar.");
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
      if (refreshOnDone) router.refresh();
    } catch {
      setError("Se ha perdido la conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoStart && enabled && !initial && !started.current) {
      started.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {!text && !loading && (
        <>
          {title && <h3>{title}</h3>}
          {description && <p className="muted">{description}</p>}
          {enabled ? (
            <button type="button" className="btn btn-primary" onClick={generate}>
              {button}
            </button>
          ) : (
            <p className="muted small">Disponible muy pronto.</p>
          )}
        </>
      )}
      {loading && !text && <p className="muted">{waiting}</p>}
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
      {text && !loading && refreshLabel && enabled && (
        <button type="button" className="btn btn-ghost btn-small" onClick={generate} style={{ marginTop: 16 }}>
          {refreshLabel}
        </button>
      )}
      {text && !loading && note && (
        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          {note}
        </p>
      )}
    </div>
  );
}
