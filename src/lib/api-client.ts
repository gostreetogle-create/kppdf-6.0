/**
 * Typed fetch wrappers для TanStack Query и Zustand store (autosave).
 * Cookie-based auth: браузер автоматически шлёт HttpOnly 'kppdf_session' — никаких Authorization headers.
 *
 * Все сериализации Decimal/BigInt/Date → на стороне API Route (см. src/lib/serialize.ts).
 * Здесь только fetch + JSON parse + throw on non-OK.
 */

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    credentials: 'same-origin',
  });
  const text = await res.text();
  const body: unknown = text ? safeJsonParse(text) : null;
  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new ApiError(message, res.status, body);
  }
  return body as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiGet = <T>(url: string): Promise<T> => request<T>(url, { method: 'GET' });
export const apiPost = <T>(url: string, body: unknown): Promise<T> =>
  request<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T>(url: string, body: unknown): Promise<T> =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = <T>(url: string): Promise<T> => request<T>(url, { method: 'DELETE' });
