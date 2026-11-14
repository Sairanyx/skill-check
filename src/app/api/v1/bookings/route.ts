import { api, caller } from "@/lib/api";
import { book } from "@/lib/services/decisions";

/** POST /api/v1/bookings {checkId, slotId}: candidate books a time after being invited. */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  const { checkId, slotId } = await req.json();
  return book(me, checkId, slotId);
});
