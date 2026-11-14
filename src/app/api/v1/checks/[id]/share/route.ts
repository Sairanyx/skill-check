import { api, caller } from "@/lib/api";
import { setSharing } from "@/lib/services/checks";

/** POST /api/v1/checks/:id/share {share}: candidate consent to share with companies that accept this check as equivalent. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/checks/[id]/share">) => {
  const me = await caller(req, ["candidate"]);
  const { share } = await req.json();
  return setSharing(me, (await params).id, !!share);
});
