export const REPORT_KINDS = ["asistente", "lectura", "numerologia"] as const;
export const REPORT_REASONS = ["inexacto", "ofensivo", "inapropiado", "otro"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportInput = { kind: ReportKind; reason: ReportReason; comment: string; content: string; path: string };
export type ReportResult = { ok: boolean; error?: string };
