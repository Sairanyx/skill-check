import "server-only";
import { eq } from "drizzle-orm";
import { db, user, session, account, skillChecks, evaluations, bookings, decisions } from "@/db";
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
