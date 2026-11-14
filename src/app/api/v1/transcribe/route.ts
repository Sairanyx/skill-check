import { api, ApiError, caller } from "@/lib/api";
import { hasLocale } from "@/i18n/config";
import { transcribe } from "@/lib/ai/transcribe";
import { limit, LIMITS } from "@/lib/rate-limit";

/** POST /api/v1/transcribe: multipart `audio` + `lang`. Speech to text in Finland, so the candidate can read it before sending. */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  limit(`transcribe:${me.id}`, ...LIMITS.transcribePerUser);
  const form = await req.formData();
  const audio = form.get("audio");
  const lang = String(form.get("lang") ?? "en");
  if (!(audio instanceof Blob) || !hasLocale(lang)) throw new ApiError(400, "audio and lang are required");
  return { text: await transcribe(audio, lang) };
});
