import { api, caller } from "@/lib/api";
import { sessionCode } from "@/lib/services/sessions";

/** GET /api/v1/sessions/:id/code: the room code, for the City's room screen only. */
export const GET = api(async (req, { params }: RouteContext<"/api/v1/sessions/[id]/code">) => {
  await caller(req, ["city"]);
  return sessionCode((await params).id);
});
