"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { reportContent } from "@/app/actions/contenido";
import type { ReportKind, ReportReason } from "@/lib/contenido";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "inexacto", label: "Es incorrecto o inexacto" },
  { value: "ofensivo", label: "Es ofensivo o dañino" },
  { value: "inapropiado", label: "Es inapropiado" },
  { value: "otro", label: "Otro motivo" },
];

/** «Reportar» bajo un texto generado por inteligencia artificial: lo recibe el administrador para revisarlo. */
export function ReportContent({ kind, content }: { kind: ReportKind; content: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inexacto");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <p className="small muted reportar">Gracias. Revisaremos este contenido.</p>;
  if (!open)
    return (
      <button type="button" className="reportar-boton" onClick={() => setOpen(true)}>
        Reportar este contenido
      </button>
    );

  const send = () =>
    start(async () => {
      const result = await reportContent({ kind, reason, comment, content, path });
      if (result.ok) setDone(true);
      else setError(result.error ?? "No se ha podido enviar el reporte.");
    });

  return (
    <div className="reportar panel">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="small muted" style={{ marginBottom: 8 }}>
          ¿Qué ocurre con este contenido?
        </legend>
        {REASONS.map((r) => (
          <label key={r.value} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <input type="radio" name="motivo" checked={reason === r.value} onChange={() => setReason(r.value)} />
            {r.label}
          </label>
        ))}
      </fieldset>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="reporte-comentario">Comentario (opcional)</label>
        <textarea id="reporte-comentario" className="input" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {error && (
        <p className="notice notice-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary btn-small" onClick={send} disabled={pending}>
          {pending ? "Enviando…" : "Enviar reporte"}
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
