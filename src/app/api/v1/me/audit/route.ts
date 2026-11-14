import { api, caller } from "@/lib/api";
import { auditTrail } from "@/lib/services/audit";

/** GET /api/v1/me/audit: who accessed my data, when and why (transparency). */
export const GET = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  return auditTrail({ subjectId: me.id });
});
