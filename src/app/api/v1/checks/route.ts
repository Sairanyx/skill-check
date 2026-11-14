import { api, caller } from "@/lib/api";
import { startCheck } from "@/lib/services/checks";

/** POST /api/v1/checks {needId, language, sessionId}: start a skill check (only checked in to an open session). */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  const { needId, language, sessionId } = await req.json();
  return startCheck(me, needId, language, sessionId);
});
