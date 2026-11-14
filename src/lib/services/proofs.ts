import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, proofs, user, CEFR, type Cefr } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { aliasFor } from "@/lib/alias";
import { proofType } from "@/lib/proofs";
import type { Need } from "@/lib/demo-data";
import { audit } from "./audit";

/**
 * Official proofs (licences, cards, degrees, language certificates).
 * The jobseeker declares what they have. City staff verify it in person at the testing room
 * (original document or public register). Companies only ever see the status for their own need.
 */

/** Jobseeker: "I have a hygiene passport" / "I have YKI Swedish B2". */
export async function declareProof(actor: ApiUser, input: { code: string; level?: string; validUntil?: string }) {
  const type = proofType(input.code);
  if (!type) throw new ApiError(400, "Unknown proof type");
  if (type.kind === "language" && !CEFR.includes(input.level as Cefr)) throw new ApiError(400, "Choose a level from A1 to C2");
  const [row] = await db
    .insert(proofs)
    .values({
      candidateId: actor.id,
      code: type.code,
      level: type.kind === "language" ? input.level : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
    })
    .returning();
  await audit(actor, "proof.declared", { subjectId: actor.id, targetType: "proof", targetId: row.id, meta: { code: type.code } });
  return row;
}

export async function myProofs(actor: ApiUser) {
  return db.select().from(proofs).where(eq(proofs.candidateId, actor.id)).orderBy(asc(proofs.createdAt));
}

/** Jobseeker can always remove their own proof (also a verified one). */
export async function removeProof(actor: ApiUser, proofId: string) {
  const deleted = await db.delete(proofs).where(and(eq(proofs.id, proofId), eq(proofs.candidateId, actor.id))).returning();
  if (!deleted.length) throw new ApiError(404, "Proof not found");
  await audit(actor, "proof.removed", { subjectId: actor.id, targetType: "proof", targetId: proofId });
  return { removed: true };
}

/**
 * City staff: what a jobseeker has declared and still needs checking.
 * Used at the testing-room desk, where staff see the person and the original document.
 */
export async function proofsToVerify(actor: ApiUser, candidateId?: string) {
  const rows = await db
    .select({ proof: proofs, name: user.name })
    .from(proofs)
    .innerJoin(user, eq(user.id, proofs.candidateId))
    .where(candidateId ? and(eq(proofs.status, "declared"), eq(proofs.candidateId, candidateId)) : eq(proofs.status, "declared"))
    .orderBy(asc(proofs.createdAt));
  await audit(actor, "proofs.listed", { subjectId: candidateId, targetType: "proof" });
  return rows.map((r) => ({ ...r.proof, candidate: r.name, alias: aliasFor(r.proof.candidateId), label: proofType(r.proof.code)?.label.en, howToCheck: proofType(r.proof.code)?.check }));
}

/** City staff record the result. Only the outcome and the method are stored, never a copy of the document. */
export async function verifyProof(actor: ApiUser, proofId: string, input: { verified: boolean; method: string; note?: string; level?: string }) {
  if (!input.method?.trim()) throw new ApiError(400, "Say how it was checked, for example: original seen");
  const proof = await db.query.proofs.findFirst({ where: eq(proofs.id, proofId) });
  if (!proof) throw new ApiError(404, "Proof not found");
  if (input.level && !CEFR.includes(input.level as Cefr)) throw new ApiError(400, "Choose a level from A1 to C2");
  const [row] = await db
    .update(proofs)
    .set({
      status: input.verified ? "verified" : "rejected",
      verifiedBy: actor.id,
      verifiedAt: new Date(),
      method: input.method.trim(),
      note: input.note?.trim() || null,
      level: input.level ?? proof.level, // staff correct the level to what the certificate says
    })
    .where(eq(proofs.id, proofId))
    .returning();
  await audit(actor, input.verified ? "proof.verified" : "proof.rejected", { subjectId: proof.candidateId, targetType: "proof", targetId: proofId, meta: { code: proof.code, method: row.method } });
  return row;
}

export type ProofStatus = { code: string; label: string; required: boolean; level?: string; status: "verified" | "declared" | "missing" };

/**
 * What the need asks for, and whether this jobseeker has it. This is all a company sees:
 * no document, no issuer, no date, so nothing that reveals age or origin.
 */
export async function proofStatusForNeed(candidateId: string, need: Pick<Need, "languageRequirements" | "proofRequirements">): Promise<ProofStatus[]> {
  const asked: { code: string; required: boolean; level?: Cefr }[] = [
    ...(need.languageRequirements ?? []).map((l) => ({ code: `language-${l.language}`, required: l.proof === "required", level: l.level })),
    ...(need.proofRequirements ?? []),
  ];
  if (!asked.length) return [];
  const mine = await db.select().from(proofs).where(eq(proofs.candidateId, candidateId));
  const now = Date.now();
  return asked.map((a) => {
    const usable = mine.filter(
      (p) => p.code === a.code && p.status !== "rejected" && (!p.validUntil || p.validUntil.getTime() > now) && (!a.level || (p.level && CEFR.indexOf(p.level as Cefr) >= CEFR.indexOf(a.level))),
    );
    const status = usable.some((p) => p.status === "verified") ? "verified" : usable.length ? "declared" : "missing";
    return { code: a.code, label: proofType(a.code)?.label.en ?? a.code, required: a.required, level: a.level, status };
  });
}
