/**
 * Correo HTML de una guía personal (misma maqueta que el de la guía de Venus), con el formato de párrafos
 * de components/RichText.tsx: **negrita**, *cursiva*, listas con «- » y subtítulos con «### ».
 */

import { siteUrl } from "@/lib/supabase/config";

type Seccion = { titulo: string; texto: string };

type Guia = {
  nombre: string;
  secciones: Seccion[];
  cta: { texto: string; boton: string; ruta: string };
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** **negrita** y *cursiva* sobre texto ya escapado. */
const inline = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");

const P = "margin:0 0 14px;";

function bloquesHtml(texto: string) {
  return texto
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      if (b.startsWith("### ")) return `<h3 style="font-size:18px;margin:22px 0 8px;color:#6b4f27">${inline(b.slice(4))}</h3>`;
      const lines = b.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return `<ul style="margin:0 0 14px;padding-left:22px">${lines.map((l) => `<li style="margin-bottom:8px">${inline(l.trim().slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p style="${P}">${inline(lines.join(" "))}</p>`;
    })
    .join("");
}

/** Correo con la guía. El nombre se escapa porque lo escribe quien rellena el formulario. */
export function guiaEmail(g: Guia, opciones: { asunto: string; titulo: string; introduccion: string }) {
  const secciones = g.secciones
    .map((s) => `<h2 style="font-size:22px;line-height:1.25;margin:34px 0 12px;padding-top:22px;border-top:1px solid #d9c9a8;color:#1a1204">${esc(s.titulo)}</h2>${bloquesHtml(s.texto)}`)
    .join("");
  const url = `${siteUrl}${g.cta.ruta}`;
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.65;color:#1a1204;max-width:600px;margin:0 auto;padding:8px 4px">
<p style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#8a6a3b;margin:0 0 6px">Códice Orbital</p>
<h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">${esc(opciones.titulo)}</h1>
<p style="${P}">${g.nombre ? `Hola, ${esc(g.nombre)}:` : "Hola:"}</p>
<p style="${P}">${esc(opciones.introduccion)}</p>
${secciones}
<div style="margin:34px 0 8px;padding:22px;background:#f7efdd;border:1px solid #d9c9a8;border-radius:10px">
${bloquesHtml(g.cta.texto)}
<p style="margin:18px 0 0"><a href="${esc(url)}" style="display:inline-block;background:#d5a66f;color:#1a1204;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${esc(g.cta.boton)} →</a></p>
</div>
<p style="${P}margin-top:26px">— Códice Orbital<br><span style="font-size:14px;color:#6b4f27">El cielo como mapa. La astrología como traducción.</span></p>
</div>`;
  return { subject: opciones.asunto, html };
}
