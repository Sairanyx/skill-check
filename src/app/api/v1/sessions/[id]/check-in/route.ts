import { api, caller } from "@/lib/api";
import { checkIn } from "@/lib/services/sessions";

/** POST /api/v1/sessions/:id/check-in {code}: candidate types the code shown in the room. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/sessions/[id]/check-in">) => {
  const me = await caller(req, ["candidate"]);
  const { code } = await req.json();
  return checkIn(me, (await params).id, code);
});
