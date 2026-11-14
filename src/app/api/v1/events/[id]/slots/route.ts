import { api, caller } from "@/lib/api";
import { freeSlots } from "@/lib/services/decisions";

/** GET /api/v1/events/:id/slots: free meeting times. */
export const GET = api(async (req, { params }: RouteContext<"/api/v1/events/[id]/slots">) => {
  await caller(req);
  return freeSlots((await params).id);
});
