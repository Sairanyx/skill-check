"use client";

/** Tiny client for our /api/v1 platform API. Throws the server's error message on failure. */
export async function apiCall<T = unknown>(path: string, init: { method?: string; json?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init.method ?? (init.json || init.form ? "POST" : "GET"),
    headers: init.json ? { "Content-Type": "application/json" } : undefined,
    body: init.json ? JSON.stringify(init.json) : init.form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}
