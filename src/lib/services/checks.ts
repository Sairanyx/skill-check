import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, skillChecks, evaluations, decisions, companies, needs, user, type StoredTurn } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { hasLocale, type Locale } from "@/i18n/config";
import { MAX_TURNS, nextQuestion } from "@/lib/ai/interviewer";
import { evaluate } from "@/lib/ai/evaluator";
import { pseudonymise } from "@/lib/ai/guard";
import { transcribe } from "@/lib/ai/transcribe";
import { loadNeed } from "./needs";
import { audit } from "./audit";
import { assertInSession } from "./sessions";

/** Below this confidence, or with any fairness flag, a person at the City reviews first. */
export const REVIEW_CONFIDENCE = 0.6;

const agentTurns = (turns: StoredTurn[]) => turns.map((t) => ({ question: t.question, answer: t.seen }));

/** Candidate starts a skill check for a need, only inside an open City session (venue rule). */
export async function startCheck(actor: ApiUser, needId: string, language: string, sessionId: string) {
  if (!hasLocale(language)) throw new ApiError(400, "language must be en, fi or sv");
  await assertInSession(actor, sessionId);
  const need = await loadNeed(needId);
  const question = await nextQuestion(need, language, []);
  const [check] = await db
    .insert(skillChecks)
    .values({ candidateId: actor.id, needId, sessionId, language, pendingQuestion: question })
    .returning();
  await audit(actor, "check.started", { subjectId: actor.id, targetType: "skill_check", targetId: check.id, meta: { needId, language, sessionId } });
  return { checkId: check.id, question, turn: 1, max: MAX_TURNS };
}

/**
 * Candidate answers the pending question (text, or audio that we transcribe).
 * Raw answer is stored only in our database. The AI agents only ever get the pseudonymised version.
 */
export async function answerCheck(actor: ApiUser, checkId: string, input: { text?: string; audio?: Blob }) {
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check || check.candidateId !== actor.id) throw new ApiError(404, "Skill check not found");
  if (check.status !== "in_progress" || !check.pendingQuestion) throw new ApiError(409, "This skill check is finished");

  const lang = check.language as Locale;
  const said = input.audio?.size ? await transcribe(input.audio, lang) : (input.text ?? "").trim();
  if (!said) throw new ApiError(400, "Empty answer");
  const seen = await pseudonymise(said);

  const turns: StoredTurn[] = [...check.turns, { question: check.pendingQuestion, said, seen }];
  const need = await loadNeed(check.needId);

  if (turns.length < MAX_TURNS) {
    const question = await nextQuestion(need, lang, agentTurns(turns));
    await db.update(skillChecks).set({ turns, pendingQuestion: question }).where(eq(skillChecks.id, checkId));
    return { done: false, said, seen, question, turn: turns.length + 1, max: MAX_TURNS };
  }

  // Last answer: the evaluator and fairness auditor run on the pseudonymised transcript.
  const ev = await evaluate(need, agentTurns(turns));
  const needsReview = ev.confidence < REVIEW_CONFIDENCE || ev.fairness.flags.length > 0;
  await db.transaction(async (tx) => {
    await tx
      .update(skillChecks)
      .set({ turns, pendingQuestion: null, status: needsReview ? "needs_review" : "evaluated", finishedAt: new Date() })
      .where(eq(skillChecks.id, checkId));
    await tx.insert(evaluations).values({
      checkId,
      match: ev.match,
      level: ev.level,
      confidence: ev.confidence,
      rubric: ev.rubric,
      strengths: ev.strengths,
      gaps: ev.gaps,
      fairnessFlags: ev.fairness.flags,
      fairnessNote: ev.fairness.note,
      model: ev.model,
    });
  });
  await audit(null, "evaluation.created", {
    subjectId: check.candidateId, targetType: "skill_check", targetId: checkId,
    meta: { model: ev.model, match: ev.match, confidence: ev.confidence, routedToHumanReview: needsReview },
  });
  return { done: true, said, seen, evaluation: ev, status: needsReview ? "needs_review" : "evaluated" };
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
  const isCompany = actor.role === "company" && need.ownerId === actor.id;
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
    candidate: { alias: candidate?.name ?? "Candidate" }, // pseudonymous alias, never the email
    turns: check.turns.map((t) => (isOwner ? t : { question: t.question, seen: t.seen })),
    pendingQuestion: isOwner ? check.pendingQuestion : undefined,
    evaluation: evaluation ?? null,
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

/** Company: evaluated candidates for its needs, best match first. Pseudonymous. */
export async function companyCandidates(actor: ApiUser, needId?: string) {
  const owned = await db
    .select({ id: needs.id })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .where(eq(companies.ownerId, actor.id));
  const ids = owned.map((n) => n.id).filter((id) => !needId || id === needId);
  if (!ids.length) return [];
  await audit(actor, "candidates.listed", { targetType: "need", targetId: needId });
  return db
    .select({
      checkId: skillChecks.id,
      needId: skillChecks.needId,
      needTitle: needs.title,
      alias: user.name,
      language: skillChecks.language,
      match: evaluations.match,
      level: evaluations.level,
      confidence: evaluations.confidence,
      finishedAt: skillChecks.finishedAt,
    })
    .from(skillChecks)
    .innerJoin(evaluations, eq(evaluations.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .innerJoin(user, eq(skillChecks.candidateId, user.id))
    .where(and(inArray(skillChecks.needId, ids), eq(skillChecks.status, "evaluated")))
    .orderBy(desc(evaluations.match));
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
