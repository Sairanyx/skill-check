import { api, caller } from "@/lib/api";
import { setContactShare } from "@/lib/services/privacy";

/** POST /api/v1/me/contact-shares {companyId, share}: candidate shares (or withdraws) their email with one company. */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  const { companyId, share } = await req.json();
  return setContactShare(me, companyId, !!share);
});
