import { api, caller } from "@/lib/api";
import { removeProof } from "@/lib/services/proofs";

/** DELETE /api/v1/me/proofs/{id}: remove one of my proofs. */
export const DELETE = api(async (req, ctx: RouteContext<"/api/v1/me/proofs/[id]">) => removeProof(await caller(req, ["candidate"]), (await ctx.params).id));
