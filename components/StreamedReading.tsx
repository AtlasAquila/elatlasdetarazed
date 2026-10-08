"use client";

import Link from "next/link";
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
  /** Empieza sola al cargar (por ejemplo, justo después de un pago). */
  autoStart?: boolean;
  /** Recarga los datos de la página al terminar (contadores, lecturas guardadas). */
  refreshOnDone?: boolean;
  /**
   * Al terminar, enlaza al cálculo guardado: el id viene en una cabecera de la respuesta
   * (`header`) y la dirección es `base` + id. Sirve cuando recargar la página haría desaparecer
   * el texto que se acaba de leer.
   */
  doneLink?: { header: string; base: string; label: string };
};

export function StreamedReading({ endpoint, body, initial, title, description, button, waiting, note, enabled, autoStart, refreshOnDone, doneLink }: Props) {
  const [text, setText] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneHref, setDoneHref] = useState<string | null>(null);
  const started = useRef(false);
  const router = useRouter();

  const generate = async () => {
    setLoading(true);
    setError(null);
    setText("");
    setDoneHref(null);
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
      const savedId = doneLink ? res.headers.get(doneLink.header) : null;
      if (savedId && /^[0-9a-f-]{36}$/i.test(savedId)) setDoneHref(`${doneLink!.base}${savedId}`);
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
      {text && !loading && !error && doneHref && doneLink && (
        <p style={{ marginTop: 24 }}>
          <Link href={doneHref} className="btn btn-primary">
            {doneLink.label}
          </Link>
        </p>
      )}
      {text && !loading && note && (
        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          {note}
        </p>
      )}
    </div>
  );
}
