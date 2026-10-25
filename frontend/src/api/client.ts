/**
 * Small fetch wrapper used by every call to the InSync research service
 * (the FastAPI app from insynccc.py / backend/main.py).
 *
 * Point the site at your server with VITE_API_BASE in a .env file, e.g.
 *   VITE_API_BASE=http://127.0.0.1:8000/api/v1
 */
export const API_BASE = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError('The research service could not be reached.', 0);
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch { /* body was not JSON */ }
    throw new ApiError(detail || `The research service returned an error (${response.status}).`, response.status);
  }
  return response.json() as Promise<T>;
}

/** GET with query-string parameters. */
export function apiGet<T>(path: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
  const query = params ? `?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}` : '';
  return request<T>(`${path}${query}`, { method: 'GET', signal });
}

/** POST with a JSON body. */
export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body), signal });
}
