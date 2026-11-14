import { api, caller } from "@/lib/api";
import { reviewQueue } from "@/lib/services/checks";

/** GET /api/v1/city/review: checks waiting for a human review. */
export const GET = api(async (req) => {
  await caller(req, ["city"]);
  return reviewQueue();
});
