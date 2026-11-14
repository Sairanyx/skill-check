import { api, caller } from "@/lib/api";
import { confirmAttendance } from "@/lib/services/company";

/** POST /api/v1/events/:id/confirm: company confirms attendance (after City approval, ≥ 1 week before). */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/events/[id]/confirm">) =>
  confirmAttendance(await caller(req, ["company"]), (await params).id),
);
