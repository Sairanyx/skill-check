import { api, caller } from "@/lib/api";
import { approveCompany } from "@/lib/services/company";

/** POST /api/v1/events/:id/applications/:appId/approve: City approves a company for the event. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/events/[id]/applications/[appId]/approve">) =>
  approveCompany(await caller(req, ["city"]), (await params).appId),
);
