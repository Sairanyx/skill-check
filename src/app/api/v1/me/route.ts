import { api, caller } from "@/lib/api";
import { myChecks } from "@/lib/services/checks";
import { eraseMe } from "@/lib/services/privacy";

/** GET /api/v1/me: who am I, plus my checks if I am a candidate. */
export const GET = api(async (req) => {
  const me = await caller(req);
  return { ...me, checks: me.role === "candidate" ? await myChecks(me) : undefined };
});

/** DELETE /api/v1/me: GDPR right to erasure. Wipes identity and answers, keeps the anonymous audit trail. */
export const DELETE = api(async (req) => eraseMe(await caller(req, ["candidate"])));
