import "server-only";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db, skillChecks, evaluations, decisions, bookings, meetingSlots, meetingRooms, user, needs, companies } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { audit } from "./audit";
import { companyMaySee } from "./checks";

type Decision = "invite" | "not_now" | "needs_review" | "approve" | "reject";
const COMPANY_DECISIONS: Decision[] = ["invite", "not_now", "needs_review"];
const CITY_DECISIONS: Decision[] = ["approve", "reject"];

/**
 * A person decides. Nothing here is automatic: the AI's score is only used to record
 * whether the person followed the AI's suggestion (ai_followed), for transparency.
 * Decisions are append-only: this is the audit trail.
 */
export async function decide(actor: ApiUser, checkId: string, decision: Decision, note?: string) {
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check) throw new ApiError(404, "Skill check not found");
  if (actor.role === "company") {
    if (!(await companyMaySee(actor, check))) throw new ApiError(404, "Skill check not found");
    if (!COMPANY_DECISIONS.includes(decision)) throw new ApiError(400, `Companies can: ${COMPANY_DECISIONS.join(", ")}`);
  } else if (actor.role === "city") {
    if (!CITY_DECISIONS.includes(decision)) throw new ApiError(400, `The City can: ${CITY_DECISIONS.join(", ")}`);
  } else throw new ApiError(403, "Only companies and the City make decisions");

  const ev = await db.query.evaluations.findFirst({ where: eq(evaluations.checkId, checkId) });
  const aiSuggestsYes = ev ? ev.match >= 6 : null;
  const saysYes = decision === "invite" || decision === "approve";
  const aiFollowed = aiSuggestsYes === null || decision === "needs_review" ? null : aiSuggestsYes === saysYes;

  const [row] = await db
    .insert(decisions)
    .values({ checkId, decidedBy: actor.id, role: actor.role, decision, aiFollowed, note: note?.trim() || null })
    .returning();

  await audit(actor, "decision.created", { subjectId: check.candidateId, targetType: "skill_check", targetId: checkId, meta: { decision, aiFollowed } });

  // Status changes that follow from a human decision.
  if (decision === "needs_review") await db.update(skillChecks).set({ status: "needs_review" }).where(eq(skillChecks.id, checkId));
  if (decision === "approve") await db.update(skillChecks).set({ status: "evaluated" }).where(eq(skillChecks.id, checkId));
  if (decision === "reject") await db.update(skillChecks).set({ status: "withdrawn" }).where(eq(skillChecks.id, checkId));
  return row;
}

/** Free meetingSlots for an event (not yet booked). */
export async function freeSlots(eventId: string) {
  return db
    .select({ id: meetingSlots.id, startsAt: meetingSlots.startsAt, endsAt: meetingSlots.endsAt, room: meetingRooms.name })
    .from(meetingSlots)
    .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
    .leftJoin(bookings, eq(bookings.slotId, meetingSlots.id))
    .where(and(eq(meetingSlots.eventId, eventId), isNull(bookings.id)))
    .orderBy(meetingSlots.startsAt);
}

/** Candidate books a meeting with a company that ACCEPTED their result (a person decided "invite"). */
export async function book(actor: ApiUser, checkId: string, slotId: string) {
  const check = await db.query.skillChecks.findFirst({ where: eq(skillChecks.id, checkId) });
  if (!check || check.candidateId !== actor.id) throw new ApiError(404, "Skill check not found");
  const [latest] = await db
    .select()
    .from(decisions)
    .where(and(eq(decisions.checkId, checkId), eq(decisions.role, "company")))
    .orderBy(desc(decisions.createdAt))
    .limit(1);
  if (latest?.decision !== "invite") throw new ApiError(403, "The company has not accepted your result yet");
  const company = await db.query.companies.findFirst({ where: eq(companies.ownerId, latest.decidedBy) });
  if (!company) throw new ApiError(404, "Company not found");

  const taken = await db.query.bookings.findFirst({ where: eq(bookings.slotId, slotId) });
  if (taken) throw new ApiError(409, "That time is already taken");
  const already = await db.query.bookings.findFirst({ where: and(eq(bookings.checkId, checkId), eq(bookings.companyId, company.id)) });
  if (already) throw new ApiError(409, "You already booked a time with this company");

  const [row] = await db.insert(bookings).values({ slotId, checkId, candidateId: actor.id, companyId: company.id }).returning();
  await audit(actor, "booking.created", { subjectId: actor.id, targetType: "booking", targetId: row.id, meta: { companyId: company.id } });
  return row;
}

/** City dashboard numbers. */
export async function cityStats() {
  const [checks] = await db
    .select({
      total: count(),
      evaluated: sql<number>`count(*) filter (where ${skillChecks.status} = 'evaluated')`,
      inReview: sql<number>`count(*) filter (where ${skillChecks.status} = 'needs_review')`,
    })
    .from(skillChecks);
  const [dec] = await db
    .select({
      total: count(),
      invites: sql<number>`count(*) filter (where ${decisions.decision} = 'invite')`,
      aiFollowed: sql<number>`count(*) filter (where ${decisions.aiFollowed} = true)`,
      aiOverridden: sql<number>`count(*) filter (where ${decisions.aiFollowed} = false)`,
    })
    .from(decisions);
  const [meet] = await db.select({ total: count() }).from(bookings);
  const [flags] = await db
    .select({ total: sql<number>`count(*) filter (where jsonb_array_length(${evaluations.fairnessFlags}) > 0)` })
    .from(evaluations);
  const num = <T extends Record<string, unknown>>(o: T) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v)])) as { [K in keyof T]: number };
  return { checks: num(checks), decisions: num(dec), meetingsBooked: Number(meet.total), fairnessFlags: Number(flags.total) };
}

/** City: full audit log of human decisions. */
export async function auditLog() {
  return db
    .select({
      at: decisions.createdAt,
      by: user.name,
      role: decisions.role,
      decision: decisions.decision,
      aiFollowed: decisions.aiFollowed,
      note: decisions.note,
      checkId: decisions.checkId,
      need: needs.title,
      company: companies.name,
    })
    .from(decisions)
    .innerJoin(user, eq(decisions.decidedBy, user.id))
    .innerJoin(skillChecks, eq(decisions.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .orderBy(desc(decisions.createdAt));
}
