import { limit, LIMITS } from "@/lib/rate-limit";
import { api, caller } from "@/lib/api";
import { startCheck } from "@/lib/services/checks";
import { kioskTokenFromRequest } from "@/lib/services/testing";

/** POST /api/v1/checks {needId, language}: start a skill check. Only on the booked City workstation, during the slot. */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  limit(`start:${me.id}`, ...LIMITS.startPerUser);
  const { needId, language } = await req.json();
  return startCheck(me, needId, language, kioskTokenFromRequest(req));
});
