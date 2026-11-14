import { api, caller } from "@/lib/api";
import { decide } from "@/lib/services/decisions";

/** POST /api/v1/checks/:id/decisions {decision, note?}: a person decides (company or City). */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/checks/[id]/decisions">) => {
  const me = await caller(req, ["company", "city"]);
  const { decision, note } = await req.json();
  return decide(me, (await params).id, decision, note);
});
