import { api, caller } from "@/lib/api";
import { companyCandidates } from "@/lib/services/checks";

/** GET /api/v1/company/candidates?needId=: evaluated candidates for my needs, best match first. */
export const GET = api(async (req) =>
  companyCandidates(await caller(req, ["company"]), new URL(req.url).searchParams.get("needId") ?? undefined),
);
