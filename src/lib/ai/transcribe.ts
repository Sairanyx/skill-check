import "server-only";
import { vllm } from "./openai-compat";
import type { Locale } from "@/i18n/config";

/** Speech → text with Whisper on our Verda GPU in Helsinki. Audio never leaves Finland. */
export async function transcribe(audio: Blob, language: Locale): Promise<string> {
  const form = new FormData();
  form.append("file", audio, "answer.webm");
  form.append("model", process.env.ASR_MODEL ?? "whisper");
  form.append("language", language);
  const out = await vllm<{ text: string }>(process.env.ASR_BASE_URL!, "/audio/transcriptions", {
    method: "POST",
    body: form,
  });
  return out.text.trim();
}
