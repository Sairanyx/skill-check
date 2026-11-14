import { api, caller } from "@/lib/api";
import { cityStats } from "@/lib/services/decisions";

/** GET /api/v1/city/stats: dashboard numbers. */
export const GET = api(async (req) => {
  await caller(req, ["city"]);
  return cityStats();
});
