/**
 * Small fetch wrapper used by every call to the InSync backend (FastAPI, ../backend).
 *
 * By default requests are relative (/api/...), so the Vite dev proxy forwards them to
 * http://127.0.0.1:8000. Set VITE_API_BASE to the backend root (no /api suffix) to bypass the proxy, e.g.
 *   VITE_API_BASE=http://127.0.0.1:8000
 */
export const API_BASE = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? '').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** FastAPI sends detail as a string (HTTPException) or an array of {msg} objects (422 validation). */
function readDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(item => (typeof item === 'string' ? item : typeof item?.msg === 'string' ? item.msg : '')).filter(Boolean).join('; ');
  return '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError('The InSync service could not be reached. Check that it is running on this machine.', 0);
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = readDetail(body?.detail);
    } catch { /* body was not JSON */ }
    throw new ApiError(detail || `The InSync service returned an error (${response.status}).`, response.status);
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

/** POST multipart/form-data. The browser sets the Content-Type (with boundary), so it is not set here. */
export function apiPostForm<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'POST', body: form, signal });
}
