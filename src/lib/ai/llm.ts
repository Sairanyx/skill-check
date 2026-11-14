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
