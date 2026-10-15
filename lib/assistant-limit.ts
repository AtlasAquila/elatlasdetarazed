/** Preguntas gratuitas al asistente dentro de la app (en la web son 3): los testers no pueden pagar Premium. */
export const APP_FREE_QUESTIONS = 10;
export const WEB_FREE_QUESTIONS = 3;

export type QuestionStatus = { plan: string; is_admin: boolean; used: number; question_limit: number; remaining: number };

/** El estado de `question_status` con el límite que corresponde a quien pregunta (app o web). */
export function effectiveQuestionStatus(status: QuestionStatus, inApp: boolean): QuestionStatus {
  if (!inApp || status.plan === "premium" || status.is_admin) return status;
  return { ...status, question_limit: APP_FREE_QUESTIONS, remaining: Math.max(APP_FREE_QUESTIONS - status.used, 0) };
}
