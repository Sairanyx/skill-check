import { api, caller } from "@/lib/api";
import { freeTestSlots } from "@/lib/services/testing";

/** GET /api/v1/test-slots: free testing-room times (venue, room, workstation) for the next days. */
export const GET = api(async (req) => {
  await caller(req);
  return freeTestSlots();
});
