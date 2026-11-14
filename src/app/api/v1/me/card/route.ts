import { api, caller } from "@/lib/api";
import { myStamps, setShowOnCard } from "@/lib/services/checks";

/** GET /api/v1/me/card: my accepted stamps. POST {show}: consent to print them on the event card. */
export const GET = api(async (req) => myStamps(await caller(req, ["candidate"])));
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  const { show } = await req.json();
  return setShowOnCard(me, !!show);
});
