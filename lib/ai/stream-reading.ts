import { AiError, MODELS, streamText } from "@/lib/ai/anthropic";

type Options = {
  system: string;
  instructions: string;
  maxTokens: number;
  /** Guarda la lectura terminada y da la compra por usada. Solo se llama si el texto está completo. */
  save: (text: string) => Promise<void>;
  /** Suelta la compra sin gastarla cuando algo falla: se puede reintentar sin pagar otra vez. */
  release: () => Promise<void>;
  /** Cabeceras extra de la respuesta (p. ej. el id del cálculo guardado). */
  headers?: Record<string, string>;
};

/**
 * Respuesta en streaming de una lectura de pago. Si la IA no la completa (error, límite de
 * tokens) o no se puede guardar, no se da por entregada: se suelta la compra y el cliente recibe
 * un aviso al final del texto (`[[ERROR]] …`).
 */
export function streamPurchasedReading({ system, instructions, maxTokens, save, release, headers }: Options): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text, stopReason } = await streamText(
          { model: MODELS.main, system, messages: [{ role: "user", content: instructions }], maxTokens },
          (chunk) => controller.enqueue(encoder.encode(chunk)),
        );
        if (!text.trim() || stopReason === "max_tokens") throw new Error("incompleta");
        await save(text.trim());
      } catch (e) {
        await release().catch(() => {});
        const msg =
          e instanceof AiError && e.status === 429
            ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto; no se te ha cobrado otra vez."
            : "No se ha podido completar la lectura. Inténtalo de nuevo: tu compra sigue disponible y no se cobrará otra vez.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...headers } });
}
