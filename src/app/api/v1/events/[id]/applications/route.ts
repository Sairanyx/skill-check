import { api, caller } from "@/lib/api";
import { eventApplications } from "@/lib/services/company";

/** GET /api/v1/events/:id/applications: City sees which companies applied. */
export const GET = api(async (req, { params }: RouteContext<"/api/v1/events/[id]/applications">) => {
  await caller(req, ["city"]);
  return eventApplications((await params).id);
});
