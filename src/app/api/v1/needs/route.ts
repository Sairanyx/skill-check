import { api, caller } from "@/lib/api";
import { createNeed, listNeeds } from "@/lib/services/needs";

/** GET /api/v1/needs: all open needs (any logged-in user). */
export const GET = api(async (req) => {
  await caller(req);
  return listNeeds();
});

/** POST /api/v1/needs {title, summary, skills[], level?, source?}: company adds a need. */
export const POST = api(async (req) => createNeed(await caller(req, ["company"]), await req.json()));
