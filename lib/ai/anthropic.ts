/**
 * Cliente mínimo de la API de Claude (Messages API) con respuesta en streaming.
 * Sin dependencias: usa fetch. Requiere la variable de entorno ANTHROPIC_API_KEY.
 */

export const MODELS = {
  /** Lecturas y asistente. */
  main: "claude-sonnet-5",
  /** Tareas internas baratas: resumir conversaciones largas. */
  light: "claude-haiku-4-5",
} as const;

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export type AiMessage = { role: "user" | "assistant"; content: string };

type Request = {
  model: string;
  system: string;
  messages: AiMessage[];
  maxTokens: number;
  /** Caché automática del prompt (sistema + historial) para abaratar preguntas seguidas. */
  cache?: boolean;
};

export type AiUsage = { input: number; output: number; cacheRead: number; cacheWrite: number };

/**
 * Sonnet 5 "piensa" por defecto antes de responder: ese razonamiento oculto gasta el límite de
 * max_tokens (y se cobra como salida), y cortaba las respuestas visibles. Lo desactivamos:
 * los datos de la carta ya llegan calculados y el texto es lo que importa.
 */
const THINKING_BY_DEFAULT = (model: string) => model.startsWith("claude-sonnet-5") || model.startsWith("claude-opus-5") || model.startsWith("claude-fable-5");

function body(req: Request, stream: boolean) {
  return JSON.stringify({
    model: req.model,
    max_tokens: req.maxTokens,
    system: req.system,
    messages: req.messages,
    stream,
    ...(THINKING_BY_DEFAULT(req.model) ? { thinking: { type: "disabled" } } : {}),
    ...(req.cache ? { cache_control: { type: "ephemeral" } } : {}),
  });
}

function headers() {
  return {
    "content-type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "anthropic-version": "2023-06-01",
  };
}

export class AiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Respuesta completa (sin streaming). */
export async function complete(req: Request): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: headers(), body: body(req, false) });
  if (!res.ok) throw new AiError(await res.text(), res.status);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.map((c) => (c.type === "text" ? c.text ?? "" : "")).join("");
}

/**
 * Respuesta en streaming. Llama a onText con cada fragmento y devuelve el texto completo y el consumo.
 */
export async function streamText(req: Request, onText: (chunk: string) => void): Promise<{ text: string; usage: AiUsage; stopReason: string | null }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: headers(), body: body(req, true) });
  if (!res.ok || !res.body) throw new AiError(await res.text(), res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let stopReason: string | null = null;
  const usage: AiUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = raw.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue;
      }
      const type = event.type as string;
      if (type === "content_block_delta") {
        const delta = event.delta as { type: string; text?: string };
        if (delta.type === "text_delta" && delta.text) {
          text += delta.text;
          onText(delta.text);
        }
      } else if (type === "message_start") {
        const u = (event.message as { usage?: Record<string, number> }).usage ?? {};
        usage.input = u.input_tokens ?? 0;
        usage.cacheRead = u.cache_read_input_tokens ?? 0;
        usage.cacheWrite = u.cache_creation_input_tokens ?? 0;
      } else if (type === "message_delta") {
        const d = event as { delta?: { stop_reason?: string }; usage?: { output_tokens?: number } };
        stopReason = d.delta?.stop_reason ?? stopReason;
        usage.output = d.usage?.output_tokens ?? usage.output;
      } else if (type === "error") {
        throw new AiError(JSON.stringify(event.error), 500);
      }
    }
  }
  return { text, usage, stopReason };
}
