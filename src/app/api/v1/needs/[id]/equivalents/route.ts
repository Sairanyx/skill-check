import { api, caller } from "@/lib/api";
import { acceptEquivalent } from "@/lib/services/company";

/** POST /api/v1/needs/:id/equivalents {otherNeedId}: results for that need count for this need too (the candidate still consents). */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/needs/[id]/equivalents">) => {
  const { otherNeedId } = await req.json();
  return acceptEquivalent(await caller(req, ["company"]), (await params).id, otherNeedId);
});
