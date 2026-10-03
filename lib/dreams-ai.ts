import { MODELS, complete } from "@/lib/ai/anthropic";
import { DREAM_EXTRACT_PROMPT } from "@/lib/ai/prompts";

/** Resumen y símbolos del sueño, para la memoria del diario. Si falla, se deja vacío. */
export async function extractDream(content: string): Promise<{ summary: string | null; symbols: string[] }> {
  try {
    const raw = await complete({ model: MODELS.light, system: DREAM_EXTRACT_PROMPT, messages: [{ role: "user", content }], maxTokens: 400 });
    const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as { summary?: unknown; symbols?: unknown };
    const summary = typeof json.summary === "string" ? json.summary.trim().slice(0, 590) : null;
    const symbols = Array.isArray(json.symbols)
      ? [...new Set(json.symbols.filter((s): s is string => typeof s === "string").map((s) => s.trim().toLowerCase().slice(0, 40)).filter(Boolean))].slice(0, 8)
      : [];
    return { summary, symbols };
  } catch {
    return { summary: null, symbols: [] };
  }
}

