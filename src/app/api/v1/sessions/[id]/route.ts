import { api, ApiError, caller } from "@/lib/api";
import { closeSession, openSession } from "@/lib/services/sessions";

/** PATCH /api/v1/sessions/:id {action: "open" | "close"}: City staff open or close the room. */
export const PATCH = api(async (req, { params }: RouteContext<"/api/v1/sessions/[id]">) => {
  const me = await caller(req, ["city"]);
  const { id } = await params;
  const { action } = await req.json();
  if (action === "open") return openSession(me, id);
  if (action === "close") return closeSession(me, id);
  throw new ApiError(400, 'action must be "open" or "close"');
});
