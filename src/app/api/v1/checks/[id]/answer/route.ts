import { api, caller } from "@/lib/api";
import { answerCheck } from "@/lib/services/checks";
import { kioskTokenFromRequest } from "@/lib/services/testing";
import { limit, LIMITS } from "@/lib/rate-limit";

/** POST /api/v1/checks/:id/answer: multipart `text` or `audio`. Returns the next question or the evaluation. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/checks/[id]/answer">) => {
  const me = await caller(req, ["candidate"]);
  limit(`answer:${me.id}`, ...LIMITS.answerPerUser);
  const form = await req.formData();
  const audio = form.get("audio");
  const text = form.get("text");
  return answerCheck(me, (await params).id, {
    audio: audio instanceof Blob ? audio : undefined,
    text: typeof text === "string" ? text : undefined,
  }, kioskTokenFromRequest(req));
});
