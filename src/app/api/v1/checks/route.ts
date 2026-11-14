import { api, caller } from "@/lib/api";
import { startCheck } from "@/lib/services/checks";

/** POST /api/v1/checks {needId, language}: candidate starts a skill check, gets the first question. */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  const { needId, language } = await req.json();
  return startCheck(me, needId, language);
});
