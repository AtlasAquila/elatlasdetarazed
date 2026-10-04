/**
 * Texto con formato sencillo para las publicaciones:
 * - párrafos separados por una línea en blanco
 * - "## " al principio de una línea: subtítulo
 * - "### ": subtítulo menor
 * - "- " al principio de cada línea: lista
 * - **negrita** y *cursiva*
 * - [texto](/ruta): enlace a otra página de esta web (solo rutas que empiezan por "/")
 */

import Link from "next/link";

function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(\/[^)\s]*\))/g).filter(Boolean);
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    if (link) return <Link key={`${keyPrefix}-${i}`} href={link[2]}>{link[1]}</Link>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="article-body">
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.startsWith("### ")) return <h3 key={key}>{inline(block.slice(4), key)}</h3>;
        if (block.startsWith("## ")) return <h2 key={key}>{inline(block.slice(3), key)}</h2>;
        const lines = block.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={key}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2), `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{inline(lines.join(" "), key)}</p>;
      })}
    </div>
  );
}
