import { api, caller } from "@/lib/api";
import { verifyProof } from "@/lib/services/proofs";

/** POST /api/v1/city/proofs/{id}/verify {verified, method, note?, level?}: record the result of the check. */
export const POST = api(async (req, ctx: RouteContext<"/api/v1/city/proofs/[id]/verify">) => verifyProof(await caller(req, ["city"]), (await ctx.params).id, await req.json()));
