import { NextResponse } from "next/server";
import { hasLocale } from "@/i18n/config";
import { transcribe } from "@/lib/ai/transcribe";
import { pseudonymise } from "@/lib/ai/guard";

/**
 * One candidate turn: (audio → Whisper →) text → Gemma guard → pseudonymised text.
 * Everything here runs against our own models in Helsinki. Only `clean` may be sent onward to Gemini.
 * Body: multipart form with `lang` and either `audio` (file) or `text`.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const lang = String(form.get("lang") ?? "en");
  if (!hasLocale(lang)) return NextResponse.json({ error: "unsupported language" }, { status: 400 });

  const audio = form.get("audio");
  const typed = form.get("text");
  const started = Date.now();

  const text =
    audio instanceof Blob && audio.size > 0
      ? await transcribe(audio, lang)
      : typeof typed === "string"
        ? typed.trim()
        : "";
  if (!text) return NextResponse.json({ error: "empty answer" }, { status: 400 });

  const clean = await pseudonymise(text);
  return NextResponse.json({ text, clean, ms: Date.now() - started });
}
