import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { think } from "@/lib/ai/llm";
import { ApiError } from "@/lib/api";
import { loadNeed } from "./needs";
import { audit } from "./audit";
import { db, companies, needs, skillChecks, decisions, bookings, meetingSlots, meetingRooms, user, events, eventCompanies, needEquivalences, type QuestionBank } from "@/db";
import type { ApiUser } from "@/lib/api";

/** The company's own needs with how many candidates are ready for review. */
export async function myNeeds(actor: ApiUser) {
  return db
    .select({ id: needs.id, title: needs.title, level: needs.level, skills: needs.skills, escoSkills: needs.escoSkills, ready: count(skillChecks.id) })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .leftJoin(skillChecks, and(eq(skillChecks.needId, needs.id), eq(skillChecks.status, "evaluated")))
    .where(eq(companies.ownerId, actor.id))
    .groupBy(needs.id)
    .orderBy(desc(needs.createdAt));
}

/** Latest company decision per check (for the candidate list). */
export async function latestDecisions(checkIds: string[]) {
  if (!checkIds.length) return new Map<string, string>();
  const rows = await db
    .select({ checkId: decisions.checkId, decision: decisions.decision, at: decisions.createdAt })
    .from(decisions)
    .where(and(inArray(decisions.checkId, checkIds), eq(decisions.role, "company")))
    .orderBy(desc(decisions.createdAt));
  const map = new Map<string, string>();
  for (const r of rows) if (!map.has(r.checkId)) map.set(r.checkId, r.decision);
  return map;
}

/** Booked meetings. The candidate's contact is shown only here: they chose to meet (mutual opt-in). */
export async function myMeetings(actor: ApiUser) {
  return db
    .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name, alias: user.name, email: user.email, need: needs.title, checkId: bookings.checkId })
    .from(bookings)
    .innerJoin(companies, eq(bookings.companyId, companies.id))
    .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
    .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
    .innerJoin(user, eq(bookings.candidateId, user.id))
    .innerJoin(skillChecks, eq(bookings.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .where(eq(companies.ownerId, actor.id))
    .orderBy(meetingSlots.startsAt);
}

export async function bookingForCheck(checkId: string) {
  const [b] = await db
    .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name, email: user.email })
    .from(bookings)
    .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
    .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
    .innerJoin(user, eq(bookings.candidateId, user.id))
    .where(eq(bookings.checkId, checkId));
  return b ?? null;
}


/* ---------- events: confirm attendance (one click, at least 1 week before) ---------- */

export const RSVP_MIN_DAYS_BEFORE = 7;

export async function companyEvents(actor: ApiUser) {
  const co = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  if (!co) return [];
  const rows = await db
    .select({ eventId: events.id, title: events.title, startsAt: events.startsAt, rsvpDeadline: events.rsvpDeadline, confirmedAt: eventCompanies.confirmedAt })
    .from(eventCompanies)
    .innerJoin(events, eq(eventCompanies.eventId, events.id))
    .where(eq(eventCompanies.companyId, co.id))
    .orderBy(events.startsAt);
  return rows.map((r) => ({ ...r, deadline: rsvpDeadline(r.startsAt, r.rsvpDeadline) }));
}

const rsvpDeadline = (startsAt: Date, set: Date | null) => {
  const weekBefore = new Date(startsAt.getTime() - RSVP_MIN_DAYS_BEFORE * 24 * 60 * 60_000);
  return set && set < weekBefore ? set : weekBefore;
};

export async function confirmAttendance(actor: ApiUser, eventId: string) {
  const co = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  const invite = co && (await db.query.eventCompanies.findFirst({ where: and(eq(eventCompanies.eventId, eventId), eq(eventCompanies.companyId, co.id)) }));
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!co || !invite || !event) throw new ApiError(404, "Event not found");
  if (Date.now() > rsvpDeadline(event.startsAt, event.rsvpDeadline).getTime())
    throw new ApiError(409, `Attendance must be confirmed at least ${RSVP_MIN_DAYS_BEFORE} days before the event`);
  await db.update(eventCompanies).set({ confirmedAt: new Date(), confirmedBy: actor.id }).where(eq(eventCompanies.id, invite.id));
  await audit(actor, "event.attendance_confirmed", { targetType: "event", targetId: eventId });
  return { confirmed: true };
}

/* ---------- need settings: check mode + optional question bank (screened) ---------- */

export async function updateNeedSettings(actor: ApiUser, needId: string, input: { checkMode?: "required" | "optional" | "off"; questionBank?: QuestionBank | null }) {
  const need = await loadNeed(needId);
  if (need.ownerId !== actor.id) throw new ApiError(404, "Need not found");
  const patch: Partial<typeof needs.$inferInsert> = {};
  if (input.checkMode) patch.checkMode = input.checkMode;
  if (input.questionBank !== undefined) {
    const clean = input.questionBank
      ? (Object.fromEntries(
          (["junior", "mid", "senior"] as const).map((l) => [l, (input.questionBank?.[l] ?? []).map((q) => q.trim()).filter(Boolean)]),
        ) as QuestionBank)
      : null;
    const all = clean ? [...(clean.junior ?? []), ...(clean.mid ?? []), ...(clean.senior ?? [])] : [];
    patch.questionBank = all.length ? clean : null;
    patch.questionBankReview = all.length ? await screenQuestions(all) : null;
  }
  const [row] = await db.update(needs).set(patch).where(eq(needs.id, needId)).returning();
  await audit(actor, "need.settings_updated", { targetType: "need", targetId: needId, meta: { checkMode: row.checkMode, questions: !!row.questionBank } });
  return row;
}

/** Fairness agent screens company questions before they are used. */
async function screenQuestions(questions: string[]) {
  const raw = await think(
    [
      {
        role: "system",
        content:
          "You check interview questions for a public-sector recruitment service. Flag any question about age, gender, family, pregnancy, health, religion, nationality, ethnic origin, political views, union membership or anything else unrelated to the job. Answer JSON {ok, problems}: ok=false if any question must be removed, problems = short reasons quoting the question.",
      },
      { role: "user", content: questions.map((q, i) => `${i + 1}. ${q}`).join("\n") },
    ],
    { json: { type: "object", properties: { ok: { type: "boolean" }, problems: { type: "array", items: { type: "string" } } }, required: ["ok", "problems"] }, maxTokens: 400 },
  );
  return JSON.parse(raw) as { ok: boolean; problems: string[] };
}

/* ---------- transferable checks: accept other companies' similar needs ---------- */

/** Other companies' needs that share at least 2 ESCO skills with one of mine (and are not accepted yet). */
export async function equivalentSuggestions(actor: ApiUser) {
  const mine = await db.select({ need: needs }).from(needs).innerJoin(companies, eq(needs.companyId, companies.id)).where(eq(companies.ownerId, actor.id));
  const others = await db
    .select({ need: needs, company: companies.name, ownerId: companies.ownerId })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id));
  const accepted = await db.select().from(needEquivalences);
  const out: { myNeedId: string; myTitle: string; otherNeedId: string; otherTitle: string; company: string; shared: string[] }[] = [];
  for (const { need: m } of mine) {
    const mUris = new Set((m.escoSkills ?? []).map((e) => e.uri));
    for (const o of others) {
      if (o.ownerId === actor.id || accepted.some((a) => a.needId === m.id && a.acceptsNeedId === o.need.id)) continue;
      const shared = (o.need.escoSkills ?? []).filter((e) => mUris.has(e.uri)).map((e) => e.label.en);
      if (shared.length >= 2) out.push({ myNeedId: m.id, myTitle: m.title, otherNeedId: o.need.id, otherTitle: o.need.title, company: o.company, shared });
    }
  }
  return out;
}

export async function acceptEquivalent(actor: ApiUser, myNeedId: string, otherNeedId: string) {
  const mine = await loadNeed(myNeedId);
  if (mine.ownerId !== actor.id) throw new ApiError(404, "Need not found");
  await loadNeed(otherNeedId);
  const [row] = await db.insert(needEquivalences).values({ needId: myNeedId, acceptsNeedId: otherNeedId, acceptedBy: actor.id }).returning();
  await audit(actor, "need.equivalence_accepted", { targetType: "need", targetId: myNeedId, meta: { acceptsNeedId: otherNeedId } });
  return row;
}

/** Need ids whose results this company may see because it accepted them as equivalent. */
export async function acceptedNeedIds(actor: ApiUser) {
  const rows = await db
    .select({ acceptsNeedId: needEquivalences.acceptsNeedId })
    .from(needEquivalences)
    .innerJoin(needs, eq(needEquivalences.needId, needs.id))
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .where(eq(companies.ownerId, actor.id));
  return rows.map((r) => r.acceptsNeedId);
}
