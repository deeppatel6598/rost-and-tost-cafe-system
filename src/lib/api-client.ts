/** Thin fetch wrapper that surfaces the server's error message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  const data = await res.json().catch(() => ({}) as any);
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code);
  }
  return data as T;
}
