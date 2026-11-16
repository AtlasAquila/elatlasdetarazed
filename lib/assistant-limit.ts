/** Preguntas gratuitas al asistente dentro de la app (en la web son 3): los testers no pueden pagar Premium. */
export const APP_FREE_QUESTIONS = 10;
export const WEB_FREE_QUESTIONS = 3;

/**
 * `question_status` devuelve este número de mensajes restantes a quien no tiene límite: los
 * administradores y las cuentas marcadas a mano con `profiles.unlimited_assistant`.
 */
export const UNLIMITED_REMAINING = 9999;

/** Caracteres por mensaje al asistente, y el margen mayor de las cuentas sin límite. */
export const ASSISTANT_MAX_CHARS = 2000;
export const ASSISTANT_MAX_CHARS_UNLIMITED = 10000;

/** Largo máximo de cada respuesta (tokens). Las cuentas sin límite pueden recibir respuestas más largas. */
export const ASSISTANT_MAX_TOKENS = 900;
export const ASSISTANT_MAX_TOKENS_UNLIMITED = 2000;

export type QuestionStatus = { plan: string; is_admin: boolean; used: number; question_limit: number; remaining: number };

export function isUnlimited(status: QuestionStatus | null): boolean {
  return Boolean(status && status.remaining >= UNLIMITED_REMAINING);
}

/** El estado de `question_status` con el límite que corresponde a quien pregunta (app o web). */
export function effectiveQuestionStatus(status: QuestionStatus, inApp: boolean): QuestionStatus {
  if (!inApp || status.plan === "premium" || isUnlimited(status)) return status;
  return { ...status, question_limit: APP_FREE_QUESTIONS, remaining: Math.max(APP_FREE_QUESTIONS - status.used, 0) };
}
