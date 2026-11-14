import "server-only";
import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db, skillChecks, evaluations, decisions, companies, needs, user, appointments, type StoredTurn } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { hasLocale, type Locale } from "@/i18n/config";
import { MAX_TURNS, nextQuestion, difficultyReached } from "@/lib/ai/interviewer";
import { evaluate } from "@/lib/ai/evaluator";
import { pseudonymise } from "@/lib/ai/guard";
import { transcribe } from "@/lib/ai/transcribe";
import { loadNeed } from "./needs";
import { audit } from "./audit";
import { assertKioskTurn } from "./testing";
import { acceptedNeedIds } from "./company";
import { aliasFor } from "@/lib/alias";

/** Below this confidence, or with any fairness flag, a person at the City reviews first. */
export const REVIEW_CONFIDENCE = 0.6;

const agentTurns = (turns: StoredTurn[]) => turns.map((t) => ({ question: t.question, answer: t.seen, difficulty: t.difficulty }));

/** Retention: results are deleted 12 months after the check. */
const RETENTION_MS = 365 * 24 * 60 * 60_000;

/**
 * Start a skill check. Only on the City workstation booked for this person, during their slot,
 * and only for a need that is part of that booking.
 */
export async function startCheck(actor: ApiUser, needId: string, language: string, kioskToken: string | null) {
  if (!hasLocale(language)) throw new ApiError(400, "language must be en, fi or sv");
  const { workstation, appointment } = await assertKioskTurn(actor, kioskToken);
  if (!appointment.needIds.includes(needId)) throw new ApiError(403, "This need is not part of your booking");
  const already = await db.query.skillChecks.findFirst({
    where: and(eq(skillChecks.appointmentId, appointment.id), eq(skillChecks.needId, needId)),
  });
  if (already) return { checkId: already.id, question: already.pendingQuestion, difficulty: already.pendingDifficulty, turn: already.turns.length + 1, max: MAX_TURNS };

  const need = await loadNeed(needId);
  const { question, difficulty } = await nextQuestion(need, language, []);
  const [check] = await db
    .insert(skillChecks)
    .values({ candidateId: actor.id, needId, appointmentId: appointment.id, workstationId: workstation.id, language, pendingQuestion: question, pendingDifficulty: difficulty })
    .returning();
  if (appointment.status === "booked") await db.update(appointments).set({ status: "in_progress" }).where(eq(appointments.id, appointment.id));
  await audit(actor, "check.started", { subjectId: actor.id, targetType: "skill_check", targetId: check.id, meta: { needId, language, workstation: workstation.label } });
  return { checkId: check.id, question, difficulty, turn: 1, max: MAX_TURNS };
}

/**
 * Candidate answers the pending question (text, or audio that we transcribe), on the same workstation.
 * Raw answer is stored only in our database. The AI agents only ever get the pseudonymised version.
 */
export async function answerCheck(actor: ApiUser, checkId: string, input: { text?: string; audio?: Blob }, kioskToken: string | null) {
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check || check.candidateId !== actor.id) throw new ApiError(404, "Skill check not found");
  if (check.status !== "in_progress" || !check.pendingQuestion) throw new ApiError(409, "This skill check is finished");
  const { workstation, appointment } = await assertKioskTurn(actor, kioskToken);
  if (workstation.id !== check.workstationId) throw new ApiError(403, "Continue on the workstation where you started");

  const lang = check.language as Locale;
  const said = input.audio?.size ? await transcribe(input.audio, lang) : (input.text ?? "").trim();
  if (!said) throw new ApiError(400, "Empty answer");
  const seen = await pseudonymise(said);

  const turns: StoredTurn[] = [...check.turns, { question: check.pendingQuestion, said, seen, difficulty: check.pendingDifficulty ?? "medium" }];
  const need = await loadNeed(check.needId);

  if (turns.length < MAX_TURNS) {
    const { question, difficulty } = await nextQuestion(need, lang, agentTurns(turns));
    await db.update(skillChecks).set({ turns, pendingQuestion: question, pendingDifficulty: difficulty }).where(eq(skillChecks.id, checkId));
    return { done: false, said, seen, question, difficulty, turn: turns.length + 1, max: MAX_TURNS };
  }

  // Last answer: the evaluator and fairness auditor run on the pseudonymised transcript.
  const ev = await evaluate(need, agentTurns(turns));
  const reached = difficultyReached(turns);
  const needsReview = ev.confidence < REVIEW_CONFIDENCE || ev.fairness.flags.length > 0;
  const finishedAt = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(skillChecks)
      .set({ turns, pendingQuestion: null, pendingDifficulty: null, status: needsReview ? "needs_review" : "evaluated", finishedAt, expiresAt: new Date(finishedAt.getTime() + RETENTION_MS) })
      .where(eq(skillChecks.id, checkId));
    await tx.insert(evaluations).values({
      checkId,
      match: ev.match,
      level: ev.level,
      confidence: ev.confidence,
      difficulty: reached,
      rubric: ev.rubric,
      strengths: ev.strengths,
      gaps: ev.gaps,
      fairnessFlags: ev.fairness.flags,
      fairnessNote: ev.fairness.note,
      model: ev.model,
    });
  });
  // Booking is complete when every need in it has a finished check.
  const done = await db.select({ needId: skillChecks.needId }).from(skillChecks).where(and(eq(skillChecks.appointmentId, appointment.id), isNotNull(skillChecks.finishedAt)));
  if (appointment.needIds.every((id) => done.some((d) => d.needId === id)))
    await db.update(appointments).set({ status: "completed" }).where(eq(appointments.id, appointment.id));

  await audit(null, "evaluation.created", {
    subjectId: check.candidateId, targetType: "skill_check", targetId: checkId,
    meta: { model: ev.model, match: ev.match, confidence: ev.confidence, difficulty: reached, routedToHumanReview: needsReview },
  });
  return { done: true, said, seen, evaluation: { ...ev, difficulty: reached }, status: needsReview ? "needs_review" : "evaluated" };
}

/**
 * Read one check. Candidate: own check, everything. Company: only checks for its own needs,
 * pseudonymised answers only, no email. City: everything except raw answers.
 */
export async function getCheck(actor: ApiUser, checkId: string) {
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check) throw new ApiError(404, "Skill check not found");
  const need = await loadNeed(check.needId);
  const isOwner = actor.role === "candidate" && check.candidateId === actor.id;
  const isCompany = actor.role === "company" && (await companyMaySee(actor, check));
  if (!isOwner && !isCompany && actor.role !== "city") throw new ApiError(404, "Skill check not found");

  if (!isOwner) await audit(actor, "check.viewed", { subjectId: check.candidateId, targetType: "skill_check", targetId: checkId });
  const evaluation = await db.query.evaluations.findFirst({ where: eq(evaluations.checkId, checkId) });
  const history = await db.select().from(decisions).where(eq(decisions.checkId, checkId)).orderBy(desc(decisions.createdAt));
  const candidate = await db.query.user.findFirst({ where: eq(user.id, check.candidateId) });

  return {
    id: check.id,
    status: check.status,
    language: check.language,
    need: { id: need.id, title: need.title, company: need.company, skills: need.skills },
    candidate: { alias: isOwner ? (candidate?.name ?? "You") : aliasFor(check.candidateId) }, // companies and City see a pseudonym
    turns: check.turns.map((t) => (isOwner ? t : { question: t.question, seen: t.seen })),
    pendingQuestion: isOwner ? check.pendingQuestion : undefined,
    evaluation: evaluation ?? null,
    shareWithEquivalent: check.shareWithEquivalent,
    showOnCard: check.showOnCard,
    sharedFromOtherCompany: isCompany && need.ownerId !== actor.id,
    decisions: history,
    startedAt: check.startedAt,
    finishedAt: check.finishedAt,
  };
}

/** Candidate's own checks. */
export async function myChecks(actor: ApiUser) {
  return db
    .select({ id: skillChecks.id, status: skillChecks.status, needTitle: needs.title, company: companies.name, match: evaluations.match })
    .from(skillChecks)
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .leftJoin(evaluations, eq(evaluations.checkId, skillChecks.id))
    .where(eq(skillChecks.candidateId, actor.id))
    .orderBy(desc(skillChecks.startedAt));
}

/** Can this company see this check? Own need, or a need it accepted as equivalent AND the candidate agreed to share. */
export async function companyMaySee(actor: ApiUser, check: { needId: string; shareWithEquivalent: boolean }) {
  const need = await loadNeed(check.needId);
  if (need.ownerId === actor.id) return true;
  return check.shareWithEquivalent && (await acceptedNeedIds(actor)).includes(check.needId);
}

/** Company: evaluated candidates for its needs (plus shared results from accepted equivalent needs), best match first. */
export async function companyCandidates(actor: ApiUser, needId?: string) {
  const owned = await db
    .select({ id: needs.id })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .where(eq(companies.ownerId, actor.id));
  const own = owned.map((n) => n.id).filter((id) => !needId || id === needId);
  const accepted = needId ? [] : await acceptedNeedIds(actor);
  if (!own.length && !accepted.length) return [];
  await audit(actor, "candidates.listed", { targetType: "need", targetId: needId });
  const visible = or(
    own.length ? inArray(skillChecks.needId, own) : undefined,
    accepted.length ? and(inArray(skillChecks.needId, accepted), eq(skillChecks.shareWithEquivalent, true)) : undefined,
  );
  return db
    .select({
      checkId: skillChecks.id,
      needId: skillChecks.needId,
      needTitle: needs.title,
      company: companies.name,
      candidateId: skillChecks.candidateId,
      language: skillChecks.language,
      match: evaluations.match,
      level: evaluations.level,
      confidence: evaluations.confidence,
      difficulty: evaluations.difficulty,
      finishedAt: skillChecks.finishedAt,
    })
    .from(skillChecks)
    .innerJoin(evaluations, eq(evaluations.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .innerJoin(user, eq(skillChecks.candidateId, user.id))
    .where(and(visible, eq(skillChecks.status, "evaluated")))
    .orderBy(desc(evaluations.match))
    .then((rows) => rows.map(({ candidateId, ...r }) => ({ ...r, alias: aliasFor(candidateId) })));
}

/** Candidate consent: share this result with companies that accept it as equivalent. */
export async function setSharing(actor: ApiUser, checkId: string, share: boolean) {
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check || check.candidateId !== actor.id) throw new ApiError(404, "Skill check not found");
  await db.update(skillChecks).set({ shareWithEquivalent: share }).where(eq(skillChecks.id, checkId));
  await audit(actor, share ? "consent.share_given" : "consent.share_withdrawn", { subjectId: actor.id, targetType: "skill_check", targetId: checkId });
  return { shareWithEquivalent: share };
}

/**
 * Stamps for the event card: one per company whose person ACCEPTED a result (latest company decision = invite).
 * No review or a rejection = no stamp. Failures never appear.
 */
export async function myStamps(actor: ApiUser) {
  const rows = await db
    .select({ checkId: skillChecks.id, showOnCard: skillChecks.showOnCard, needTitle: needs.title, decision: decisions.decision, at: decisions.createdAt, decidedBy: decisions.decidedBy })
    .from(skillChecks)
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .innerJoin(decisions, and(eq(decisions.checkId, skillChecks.id), eq(decisions.role, "company")))
    .where(eq(skillChecks.candidateId, actor.id))
    .orderBy(desc(decisions.createdAt));
  const latest = new Map<string, (typeof rows)[number]>(); // per check + deciding company
  for (const r of rows) if (!latest.has(`${r.checkId}:${r.decidedBy}`)) latest.set(`${r.checkId}:${r.decidedBy}`, r);
  const accepted = [...latest.values()].filter((r) => r.decision === "invite");
  const owners = accepted.length ? await db.select({ ownerId: companies.ownerId, name: companies.name }).from(companies).where(inArray(companies.ownerId, accepted.map((a) => a.decidedBy))) : [];
  return accepted.map((a) => ({ checkId: a.checkId, company: owners.find((o) => o.ownerId === a.decidedBy)?.name ?? "Company", needTitle: a.needTitle, showOnCard: a.showOnCard }));
}

/** Candidate consent: print accepted stamps on the event card (one switch for all). */
export async function setShowOnCard(actor: ApiUser, show: boolean) {
  await db.update(skillChecks).set({ showOnCard: show }).where(eq(skillChecks.candidateId, actor.id));
  await audit(actor, show ? "consent.card_given" : "consent.card_withdrawn", { subjectId: actor.id, targetType: "user", targetId: actor.id });
  return { showOnCard: show };
}

/** City: checks waiting for a human review (low confidence or fairness flags). */
export async function reviewQueue() {
  return db
    .select({
      checkId: skillChecks.id,
      needTitle: needs.title,
      company: companies.name,
      match: evaluations.match,
      confidence: evaluations.confidence,
      flags: evaluations.fairnessFlags,
      finishedAt: skillChecks.finishedAt,
    })
    .from(skillChecks)
    .innerJoin(evaluations, eq(evaluations.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .where(eq(skillChecks.status, "needs_review"))
    .orderBy(desc(skillChecks.finishedAt));
}
