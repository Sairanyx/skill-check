import "server-only";
import { vllm } from "./openai-compat";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * The "thinking" model: interviewer, evaluator, fairness auditor.
 * INTERVIEW_PROVIDER=gemma  → Gemma 4 on our Verda server (default, works today)
 * INTERVIEW_PROVIDER=gemini → Gemini Pro (wired in once the API key arrives)
 * It only ever receives pseudonymised text.
 */
export async function think(
  messages: ChatMessage[],
  opts: { json?: object; maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const provider = process.env.INTERVIEW_PROVIDER ?? "gemma";
  if (provider === "gemini") throw new Error("Gemini provider not wired yet (waiting for API key)");

  const out = await vllm<{ choices: { message: { content: string } }[] }>(
    process.env.GUARD_BASE_URL!,
    "/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GUARD_MODEL ?? "gemma",
        messages,
        max_tokens: opts.maxTokens ?? 800,
        temperature: opts.temperature ?? 0.3,
        ...(opts.json
          ? { response_format: { type: "json_schema", json_schema: { name: "out", schema: opts.json } } }
          : {}),
      }),
    },
  );
  return out.choices[0].message.content.trim();
}

export const modelLabel = () =>
  (process.env.INTERVIEW_PROVIDER ?? "gemma") === "gemini" ? "Gemini Pro" : "Gemma 4 26B on Verda, Finland";

/**
 * Structured answer with a safety net: if the model returns JSON that does not parse
 * (for example cut off at the token limit), retry once deterministically with more room.
 */
export async function thinkJson<T>(messages: ChatMessage[], opts: { json: object; maxTokens?: number; temperature?: number }): Promise<T> {
  const first = await think(messages, opts);
  try {
    return JSON.parse(first) as T;
  } catch {
    const retry = await think(messages, { ...opts, temperature: 0, maxTokens: Math.round((opts.maxTokens ?? 800) * 1.5) });
    return JSON.parse(retry) as T; // still broken → the caller's error handling decides
  }
}

/** Like think(), but the returned text is guaranteed to be valid JSON (one deterministic retry), or it throws. */
export async function thinkJsonRaw(messages: ChatMessage[], opts: { json?: object; maxTokens?: number; temperature?: number }): Promise<string> {
  const first = await think(messages, opts);
  try {
    JSON.parse(first);
    return first;
  } catch (e) {
    logBadJson("first try", first, e);
    const retry = await think(messages, { ...opts, temperature: 0, maxTokens: Math.round((opts.maxTokens ?? 800) * 1.5) });
    try {
      JSON.parse(retry);
      return retry;
    } catch (e2) {
      logBadJson("retry", retry, e2);
      throw e2;
    }
  }
}

/** Observability: record what the model returned when JSON breaks (no candidate text: only length and edges). */
function logBadJson(stage: string, text: string, err: unknown) {
  console.error(
    JSON.stringify({ event: "ai.bad_json", stage, model: process.env.GUARD_MODEL, length: text.length, start: text.slice(0, 40), end: text.slice(-40), error: (err as Error).message }),
  );
}
