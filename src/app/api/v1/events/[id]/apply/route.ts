import { api, caller } from "@/lib/api";
import { applyToEvent } from "@/lib/services/company";

/** POST /api/v1/events/:id/apply {checkMode}: company applies (or changes its skill check choice). */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/events/[id]/apply">) => {
  const me = await caller(req, ["company"]);
  const { checkMode } = await req.json();
  return applyToEvent(me, (await params).id, ["required", "optional", "off"].includes(checkMode) ? checkMode : "required");
});
