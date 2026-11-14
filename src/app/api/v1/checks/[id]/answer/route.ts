import { api, caller } from "@/lib/api";
import { answerCheck } from "@/lib/services/checks";

/** POST /api/v1/checks/:id/answer: multipart `text` or `audio`. Returns the next question or the evaluation. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/checks/[id]/answer">) => {
  const me = await caller(req, ["candidate"]);
  const form = await req.formData();
  const audio = form.get("audio");
  const text = form.get("text");
  return answerCheck(me, (await params).id, {
    audio: audio instanceof Blob ? audio : undefined,
    text: typeof text === "string" ? text : undefined,
  });
});
