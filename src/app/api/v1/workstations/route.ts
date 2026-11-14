import { api, caller } from "@/lib/api";
import { testingOverview } from "@/lib/services/testing";

/** GET /api/v1/workstations: City overview of testing rooms, computers and bookings. */
export const GET = api(async (req) => {
  await caller(req, ["city"]);
  return testingOverview();
});
