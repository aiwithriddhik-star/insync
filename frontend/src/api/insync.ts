import { apiGet, apiPost, apiPostForm } from './client';

/** Typed clients for the InSync backend (health, chat, PCOS research model, lab report explainer). */

export type Health = { status: 'online'; llm: { reachable: boolean; model: string; base_url: string } };
export const getHealth = (signal?: AbortSignal) => apiGet<Health>('/api/health', undefined, signal);

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export type ChatSource = { filename: string; page: number | null; source_id: string };
export type ChatResponse = { answer: string; suggestions: string[]; sources: ChatSource[] };
export const sendChat = (query: string, history: ChatTurn[] = [], sourceId?: string | null, signal?: AbortSignal) =>
  apiPost<ChatResponse>('/api/chat', { query, source_id: sourceId ?? null, history }, signal);

/** Keys are the exact training column names used by the model. */
export type PsocPayload = Partial<Record<
  | 'Follicle No. (R)' | 'Follicle No. (L)' | 'Cycle length(days)' | 'AMH(ng/mL)' | 'BMI' | 'Weight (Kg)' | 'Age (yrs)' | 'Waist(inch)' | 'Hip(inch)'
  | 'Skin darkening (Y/N)' | 'hair growth(Y/N)' | 'Weight gain(Y/N)' | 'Cycle(R/I)' | 'Fast food (Y/N)' | 'Pimples(Y/N)' | 'Hair loss(Y/N)',
  number | null
>>;
export type PsocResponse = { pcos_probability: number; prediction: 0 | 1; missing_fields: string[] };
export const estimatePsoc = (payload: PsocPayload, signal?: AbortSignal) => apiPost<PsocResponse>('/api/psoc', payload, signal);

export type ReportTest = { name: string; result: string; unit: string; range: string; status: 'below' | 'within' | 'above' | 'unknown'; meaning: string };
export type ReportExplanation = {
  filename: string;
  source_id: string | null;
  summary: string;
  tests: ReportTest[];
  glossary: { term: string; explanation: string }[];
  questions: string[];
};
/** Can take 30-90 seconds while the local model reads the report. */
export function explainReport(file: File, meta: { title?: string; category?: string } = {}, signal?: AbortSignal) {
  const form = new FormData();
  form.append('file', file);
  if (meta.title) form.append('title', meta.title);
  if (meta.category) form.append('category', meta.category);
  return apiPostForm<ReportExplanation>('/api/report/explain', form, signal);
}
