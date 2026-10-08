import Link from "next/link";
import { RichText } from "./RichText";

export type QaMessage = { role: "user" | "assistant"; content: string };

/** Agrupa la conversación en pares pregunta-respuesta (una pregunta sin respuesta se descarta). */
export function pairMessages(messages: QaMessage[]) {
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "user" && messages[i + 1].role === "assistant") {
      pairs.push({ question: messages[i].content, answer: messages[i + 1].content });
      i++;
    }
  }
  return pairs;
}

/** Las preguntas hechas a Alshain sobre esta carta, con sus respuestas, y el acceso para seguir preguntando. */
export function ChartQuestions({ chartId, pairs }: { chartId: string; pairs: { question: string; answer: string }[] }) {
  return (
    <>
      {pairs.length === 0 ? (
        <p className="muted">Todavía no has hecho ninguna pregunta sobre esta carta. Alshain responde con los datos exactos de tu cielo y recuerda lo que habláis.</p>
      ) : (
        <div className="qa-list">
          {pairs.map((p, i) => (
            <article key={i} className="qa">
              <p className="qa-question">{p.question}</p>
              <RichText text={p.answer} />
            </article>
          ))}
        </div>
      )}
      <p style={{ marginBottom: 0 }}>
        <Link href={`/carta/${chartId}/asistente`} className="btn btn-primary">
          {pairs.length === 0 ? "Pregunta a Alshain" : "Seguir preguntando a Alshain"}
        </Link>
      </p>
    </>
  );
}
