import { api, caller } from "@/lib/api";
import { revealIdentity } from "@/lib/services/privacy";

/** POST /api/v1/checks/:id/identity {reason}: City only. Reveals who is behind a check. Logged with the reason. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/checks/[id]/identity">) => {
  const me = await caller(req, ["city"]);
  const { reason } = await req.json();
  return revealIdentity(me, (await params).id, reason);
});
