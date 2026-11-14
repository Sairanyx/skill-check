import { api, caller } from "@/lib/api";
import { proofsToVerify } from "@/lib/services/proofs";

/** GET /api/v1/city/proofs?candidateId=: proofs waiting for a City check (at the testing-room desk). */
export const GET = api(async (req) => proofsToVerify(await caller(req, ["city"]), new URL(req.url).searchParams.get("candidateId") ?? undefined));
