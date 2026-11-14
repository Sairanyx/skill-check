import { api, caller } from "@/lib/api";
import { createNeed, listNeeds } from "@/lib/services/needs";
import { limit, LIMITS } from "@/lib/rate-limit";

/** GET /api/v1/needs: all open needs (any logged-in user). */
export const GET = api(async (req) => {
  await caller(req);
  return listNeeds();
});

/** POST /api/v1/needs {title, summary, skills[], level?, source?}: company adds a need. */
export const POST = api(async (req) => {
  const me = await caller(req, ["company"]);
  limit(`need:${me.id}`, ...LIMITS.newNeedPerUser);
  return createNeed(me, await req.json());
});
