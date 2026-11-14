import { api, caller } from "@/lib/api";
import { getCheck } from "@/lib/services/checks";

/** GET /api/v1/checks/:id: what you may see depends on your role. */
export const GET = api(async (req, { params }: RouteContext<"/api/v1/checks/[id]">) =>
  getCheck(await caller(req), (await params).id),
);
