"use client";

import { useState } from "react";
import { RichText } from "./RichText";

type Props = {
  chartId: string;
  reading: string | null;
  enabled: boolean;
};

function useStreamedReading(chartId: string, initial: string | null) {
  const [text, setText] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const res = await fetch("/api/lectura", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chartId }) });
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

  return { text, loading, error, generate };
}

export function ReadingPanel({ chartId, reading, enabled }: Props) {
  const lectura = useStreamedReading(chartId, reading);

  return (
    <div>
      <div>
        {!enabled && <p className="muted">Las lecturas se activarán muy pronto.</p>}

        {enabled && !lectura.text && !lectura.loading && (
          <>
            <h2>Tu cielo, leído en conjunto</h2>
            <p className="muted">
              Una lectura extensa, de unas 3.000 palabras, escrita a partir de los datos exactos de tu carta: tu núcleo (Sol, Luna y Ascendente), tu temperamento, tu forma de pensar y comunicarte, tus afectos, tu energía, tu vocación, tus tensiones y tus dones, Quirón y los Nodos, relacionados entre sí.
            </p>
            <button type="button" className="btn btn-primary" onClick={lectura.generate}>
              Leer mi carta
            </button>
          </>
        )}
        {enabled && lectura.loading && !lectura.text && <p className="muted">Alshain está leyendo tu cielo. La lectura es larga y tardará entre uno y tres minutos en completarse; puedes ir leyendo mientras se escribe.</p>}
        {lectura.text && <RichText text={lectura.text} />}
        {lectura.loading && lectura.text && (
          <p className="small muted" aria-live="polite">
            Alshain sigue escribiendo…
          </p>
        )}
        {lectura.error && (
          <p className="notice notice-error" role="alert">
            {lectura.error}
          </p>
        )}

        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta.
        </p>
      </div>
    </div>
  );
}
