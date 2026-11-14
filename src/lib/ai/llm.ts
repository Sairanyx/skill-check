import "server-only";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Model providers. Every provider speaks the same OpenAI-compatible API, so adding one is a setting:
 *   gemma   → Gemma 4 on our Verda server in Finland (default)
 *   mistral → Mistral Small on a second Verda server in Finland
 *   gemini  → Gemini through Google's OpenAI-compatible endpoint (free key: synthetic demo data only)
 *   any other name X → X_BASE_URL, X_API_KEY, X_MODEL (e.g. DeepSeek on Verda Inference as a fallback)
 * Every provider only ever receives pseudonymised text.
 */
export type Provider = string;

const PROVIDERS: Record<string, { base: () => string | undefined; key: () => string | undefined; model: () => string; label: string }> = {
  gemma: { base: () => process.env.GUARD_BASE_URL, key: () => process.env.VLLM_API_KEY, model: () => process.env.GUARD_MODEL ?? "gemma", label: "Gemma 4 26B (Google, open) on Verda, Finland" },
  mistral: { base: () => process.env.MISTRAL_BASE_URL, key: () => process.env.MISTRAL_API_KEY ?? process.env.VLLM_API_KEY, model: () => process.env.MISTRAL_MODEL ?? "mistral", label: "Mistral Small 24B (Mistral AI, open) on Verda, Finland" },
  gemini: { base: () => process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai", key: () => process.env.GEMINI_API_KEY, model: () => process.env.GEMINI_MODEL ?? "gemini-3.5-flash", label: `Gemini (${process.env.GEMINI_MODEL ?? "gemini-3.5-flash"}, Google cloud)` },
};
const provider = (name: string) => {
  const p = PROVIDERS[name];
  if (p) return p;
  const env = name.toUpperCase();
  return { base: () => process.env[`${env}_BASE_URL`], key: () => process.env[`${env}_API_KEY`], model: () => process.env[`${env}_MODEL`] ?? name, label: name };
};
export const providerLabel = (name: string) => provider(name).label;

/** Judges for the scoring panel, e.g. JUDGES=gemma,mistral,gemini. One judge = two runs of the same model. */
export const judges = (): Provider[] => (process.env.JUDGES ?? "gemma").split(",").map((j) => j.trim()).filter(Boolean);

/**
 * The "thinking" model: interviewer, evaluator, fairness auditor.
 * INTERVIEW_PROVIDER picks the default (gemma). The scoring panel passes its own provider per judge.
 */
export async function think(
  messages: ChatMessage[],
  opts: { json?: object; maxTokens?: number; temperature?: number; provider?: Provider } = {},
): Promise<string> {
  const name = opts.provider ?? process.env.INTERVIEW_PROVIDER ?? "gemma";
  const p = provider(name);
  const base = p.base();
  if (!base) throw new Error(`Model provider "${name}" is not configured`);
  const res = await fetchWithRetry(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key()}` },
    body: JSON.stringify({
      model: p.model(),
      messages,
      max_tokens: opts.maxTokens ?? 800,
      temperature: opts.temperature ?? 0.3,
      ...(opts.json ? { response_format: { type: "json_schema", json_schema: { name: "out", schema: opts.json } } } : {}),
      ...(name === "gemini" ? { reasoning_effort: "low" } : {}), // keep latency close to the others
    }),
  });
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const out = (await res.json()) as { choices: { message: { content: string } }[] };
  return (out.choices[0].message.content ?? "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
}

/** Rate limits (429) and overload (503) are temporary: wait and try again, up to 3 times. */
async function fetchWithRetry(url: string, init: RequestInit & { signal?: AbortSignal }): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(120_000) });
    if ((res.status !== 429 && res.status !== 503) || attempt === 3) return res;
    const wait = Number(res.headers.get("retry-after")) * 1000 || 4000 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, Math.min(wait, 30_000)));
  }
}

export const modelLabel = () => {
  const j = judges();
  return j.length > 1 ? `Panel: ${j.map(providerLabel).join(" + ")}` : providerLabel(process.env.INTERVIEW_PROVIDER ?? "gemma");
};

/**
 * Structured answer with a safety net: if the model returns JSON that does not parse
 * (for example cut off at the token limit), retry once deterministically with more room.
 */
export async function thinkJson<T>(messages: ChatMessage[], opts: { json: object; maxTokens?: number; temperature?: number; provider?: Provider }): Promise<T> {
  const first = await think(messages, opts);
  try {
    return JSON.parse(first) as T;
  } catch {
    const retry = await think(messages, { ...opts, temperature: 0, maxTokens: Math.round((opts.maxTokens ?? 800) * 1.5) });
    return JSON.parse(retry) as T; // still broken → the caller's error handling decides
  }
}

/** Like think(), but the returned text is guaranteed to be valid JSON (one deterministic retry), or it throws. */
export async function thinkJsonRaw(messages: ChatMessage[], opts: { json?: object; maxTokens?: number; temperature?: number; provider?: Provider }): Promise<string> {
  const first = await think(messages, opts);
  try {
    JSON.parse(first);
    return first;
  } catch (e) {
    logBadJson("first try", first, e, opts.provider);
    const retry = await think(messages, { ...opts, temperature: 0, maxTokens: Math.round((opts.maxTokens ?? 800) * 1.5) });
    try {
      JSON.parse(retry);
      return retry;
    } catch (e2) {
      logBadJson("retry", retry, e2, opts.provider);
      throw e2;
    }
  }
}

/** Observability: record what the model returned when JSON breaks (no candidate text: only length and edges). */
function logBadJson(stage: string, text: string, err: unknown, provider?: string) {
  console.error(
    JSON.stringify({ event: "ai.bad_json", stage, model: provider ?? process.env.INTERVIEW_PROVIDER ?? "gemma", length: text.length, start: text.slice(0, 40), end: text.slice(-40), error: (err as Error).message }),
  );
}
