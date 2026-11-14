import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, user, session, account, skillChecks, evaluations, bookings, decisions, contactShares, companies } from "@/db";
import { ApiError } from "@/lib/api";
import { aliasFor } from "@/lib/alias";
import type { ApiUser } from "@/lib/api";
import { audit, auditTrail } from "./audit";

/** GDPR Art. 15 + 20: everything we hold about the candidate, as JSON they can download. */
export async function exportMyData(actor: ApiUser) {
  const me = await db.query.user.findFirst({ where: eq(user.id, actor.id) });
  const checks = await db.select().from(skillChecks).where(eq(skillChecks.candidateId, actor.id));
  const evals = await Promise.all(checks.map((c) => db.query.evaluations.findFirst({ where: eq(evaluations.checkId, c.id) })));
  const decs = await Promise.all(checks.map((c) => db.select().from(decisions).where(eq(decisions.checkId, c.id))));
  const myBookings = await db.select().from(bookings).where(eq(bookings.candidateId, actor.id));
  await audit(actor, "data.exported", { subjectId: actor.id, targetType: "user", targetId: actor.id });
  return {
    exportedAt: new Date().toISOString(),
    controller: "City of Espoo",
    account: { id: me?.id, name: me?.name, email: me?.email, role: me?.role, createdAt: me?.createdAt },
    skillChecks: checks.map((c, i) => ({ ...c, evaluation: evals[i] ?? null, humanDecisions: decs[i] })),
    bookings: myBookings,
    accessLog: await auditTrail({ subjectId: actor.id }),
  };
}

/**
 * GDPR Art. 17: erase the candidate. Identity and answers are wiped. Scores, human decisions and the
 * audit trail are kept without identity, because the City must be able to show how decisions were made.
 */
export async function eraseMe(actor: ApiUser) {
  const tag = `erased-${actor.id.slice(0, 8)}`;
  await db.transaction(async (tx) => {
    const checks = await tx.select().from(skillChecks).where(eq(skillChecks.candidateId, actor.id));
    for (const c of checks) {
      await tx
        .update(skillChecks)
        .set({ turns: c.turns.map((t) => ({ question: t.question, said: "[erased]", seen: "[erased]" })), pendingQuestion: null, status: "withdrawn" })
        .where(eq(skillChecks.id, c.id));
      await tx.update(evaluations).set({ rubric: [], strengths: [], gaps: [] }).where(eq(evaluations.checkId, c.id)); // quotes contained their words
    }
    await tx.delete(bookings).where(eq(bookings.candidateId, actor.id));
    await tx.delete(session).where(eq(session.userId, actor.id));
    await tx.delete(account).where(eq(account.userId, actor.id)); // password hash
    await tx.update(user).set({ name: "Erased user", email: `${tag}@erased.invalid`, image: null }).where(eq(user.id, actor.id));
  });
  await audit({ ...actor, name: "Erased user", email: "" }, "account.erased", { subjectId: actor.id, targetType: "user", targetId: actor.id });
  return { erased: true };
}

/* ---------- contact sharing (candidate consent per company) ---------- */

export async function setContactShare(actor: ApiUser, companyId: string, share: boolean) {
  const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
  if (!company) throw new ApiError(404, "Company not found");
  const active = await db.query.contactShares.findFirst({
    where: and(eq(contactShares.candidateId, actor.id), eq(contactShares.companyId, companyId), isNull(contactShares.revokedAt)),
  });
  if (share && !active) await db.insert(contactShares).values({ candidateId: actor.id, companyId });
  if (!share && active) await db.update(contactShares).set({ revokedAt: new Date() }).where(eq(contactShares.id, active.id));
  await audit(actor, share ? "consent.contact_shared" : "consent.contact_withdrawn", { subjectId: actor.id, targetType: "company", targetId: companyId });
  return { shared: share };
}

/** Email of the candidate, only if they chose to share it with this company. */
export async function sharedContact(candidateId: string, companyId: string) {
  const active = await db.query.contactShares.findFirst({
    where: and(eq(contactShares.candidateId, candidateId), eq(contactShares.companyId, companyId), isNull(contactShares.revokedAt)),
  });
  if (!active) return null;
  const u = await db.query.user.findFirst({ where: eq(user.id, candidateId) });
  return u?.email ?? null;
}

/** City only: reveal who is behind a pseudonymised check. A deliberate, logged action. */
export async function revealIdentity(actor: ApiUser, checkId: string, reason: string) {
  if (actor.role !== "city") throw new ApiError(403, "Only the City can see identities");
  if (!reason?.trim()) throw new ApiError(400, "Give a reason (it is recorded)");
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check) throw new ApiError(404, "Skill check not found");
  const u = await db.query.user.findFirst({ where: eq(user.id, check.candidateId) });
  await audit(actor, "identity.revealed", { subjectId: check.candidateId, targetType: "skill_check", targetId: checkId, meta: { reason: reason.trim() } });
  return { alias: aliasFor(check.candidateId), name: u?.name, email: u?.email };
}
