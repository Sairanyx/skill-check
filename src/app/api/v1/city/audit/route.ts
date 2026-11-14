import { api, caller } from "@/lib/api";
import { auditTrail } from "@/lib/services/audit";
import { auditLog } from "@/lib/services/decisions";

/** GET /api/v1/city/audit: GDPR access trail (who touched which personal data) + human decisions. */
export const GET = api(async (req) => {
  await caller(req, ["city"]);
  return { access: await auditTrail(), decisions: await auditLog() };
});
