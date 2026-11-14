import { api, caller } from "@/lib/api";
import { declareProof, myProofs } from "@/lib/services/proofs";
import { PROOF_TYPES } from "@/lib/proofs";

/** GET /api/v1/me/proofs: my proofs and the catalogue of proof types. */
export const GET = api(async (req) => ({ proofs: await myProofs(await caller(req, ["candidate"])), types: PROOF_TYPES }));

/** POST /api/v1/me/proofs {code, level?, validUntil?}: "I have this". City staff verify it at my visit. */
export const POST = api(async (req) => declareProof(await caller(req, ["candidate"]), await req.json()));
