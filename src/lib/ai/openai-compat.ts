import "server-only";

// Minimal client for our self-hosted vLLM services (OpenAI-compatible API) on Verda, Helsinki.
export async function vllm<T>(baseUrl: string, path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VLLM_API_KEY}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`vLLM ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
