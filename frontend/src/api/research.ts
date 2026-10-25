import { API_BASE, ApiError, apiGet, apiPost } from './client';

export type CloudTerm = { text: string; value: number };
export type Passage = { chunk_id: number; content: string };
export type DrillDown = { keyword: string; matched_count: number; total_matched?: number; results: Passage[] };
export type ThemeMatch = { status: string; topic_id: number; keywords: CloudTerm[]; message?: string };

/**
 * GET /wordcloud. If the service is offline, falls back to a cloud_terms.json
 * placed in /public (the notebook already exports that file).
 */
export async function loadCloudTerms(limit: number, signal?: AbortSignal): Promise<{ terms: CloudTerm[]; source: 'api' | 'file' }> {
  try {
    const response = await apiGet<{ data: CloudTerm[] }>('/api/v1/wordcloud', { limit }, signal);
    return { terms: response.data, source: 'api' };
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    try {
      const file = await fetch('/cloud_terms.json', { signal });
      const data = file.ok ? await file.json() : null;
      if (Array.isArray(data) && data.length && typeof data[0]?.text === 'string') return { terms: data.slice(0, limit), source: 'file' };
    } catch (fileError) {
      if ((fileError as Error).name === 'AbortError') throw fileError;
    }
    throw error;
  }
}

/** GET /drill-down: passages from the research papers that mention a word. */
export const loadPassages = (keyword: string, limit = 5, signal?: AbortSignal) =>
  apiGet<DrillDown>('/api/v1/drill-down', { keyword, limit }, signal);

/** POST /classify: which research theme does a question sit closest to? */
export const classifyQuestion = (text: string, signal?: AbortSignal) =>
  apiPost<ThemeMatch>('/api/v1/classify', { text }, signal);

/** GET /export-cloud-image: the server-rendered PNG, as a data URL. */
export const loadCloudImage = (signal?: AbortSignal) =>
  apiGet<{ data: string }>('/api/v1/export-cloud-image', undefined, signal).then(response => response.data);

/** URL of an interactive BERTopic chart served by the backend (topic_barchart, topic_hierarchy, topic_distance_map). */
export const chartUrl = (name: 'topic_barchart' | 'topic_hierarchy' | 'topic_distance_map') => `${API_BASE}/api/v1/charts/${name}`;

export { ApiError };
