import { api, caller } from "@/lib/api";
import { draftNeedFromUrl } from "@/lib/services/needs";
import { limit } from "@/lib/rate-limit";

/** POST /api/v1/needs/draft {url}: Context.dev reads the company's page, the AI drafts a need. Nothing is saved. */
export const POST = api(async (req) => {
  const me = await caller(req, ["company"]);
  limit(`draft:${me.id}`, 10, 60 * 60_000);
  const { url } = await req.json();
  return draftNeedFromUrl(me, String(url ?? ""));
});
