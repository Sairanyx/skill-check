import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { thinkJsonRaw } from "@/lib/ai/llm";
import { ApiError } from "@/lib/api";
import { loadNeed } from "./needs";
import { audit } from "./audit";
import { aliasFor } from "@/lib/alias";
import { sharedContact } from "./privacy";
import { db, companies, needs, skillChecks, decisions, bookings, meetingSlots, meetingRooms, events, eventNeeds, eventCompanies, needEquivalences, type QuestionBank } from "@/db";
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

/** Booked meetings. Companies see the alias only. Contact appears only if the candidate shared it. */
export async function myMeetings(actor: ApiUser) {
  const co = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  if (!co) return [];
  const rows = await db
    .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name, candidateId: bookings.candidateId, need: needs.title, checkId: bookings.checkId })
    .from(bookings)
    .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
    .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
    .innerJoin(skillChecks, eq(bookings.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .where(eq(bookings.companyId, co.id))
    .orderBy(meetingSlots.startsAt);
  return Promise.all(rows.map(async ({ candidateId, ...r }) => ({ ...r, alias: aliasFor(candidateId), contact: await sharedContact(candidateId, co.id) })));
}

/** This company's meeting for a check (alias + time; contact only if shared). */
export async function bookingForCheck(actor: ApiUser, checkId: string) {
  const co = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  if (!co) return null;
  const [b] = await db
    .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name, candidateId: bookings.candidateId })
    .from(bookings)
    .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
    .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
    .where(and(eq(bookings.checkId, checkId), eq(bookings.companyId, co.id)));
  if (!b) return null;
  return { startsAt: b.startsAt, room: b.room, contact: await sharedContact(b.candidateId, co.id) };
}

/* ---------- events: confirm attendance (one click, at least 1 week before) ---------- */

export const RSVP_MIN_DAYS_BEFORE = 7;

type CheckMode = "required" | "optional" | "off";

/** Upcoming City events and this company's status at each (not applied / applied / approved / confirmed). */
export async function companyEvents(actor: ApiUser) {
  const co = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  if (!co) return [];
  const all = await db.select().from(events).orderBy(events.startsAt);
  const mine = await db.select().from(eventCompanies).where(eq(eventCompanies.companyId, co.id));
  return all.map((e) => {
    const m = mine.find((x) => x.eventId === e.id);
    return {
      eventId: e.id,
      title: e.title,
      startsAt: e.startsAt,
      mode: e.mode,
      location: e.location,
      checkPolicy: e.checkPolicy,
      deadline: rsvpDeadline(e.startsAt, e.rsvpDeadline),
      status: !m ? "not_applied" : m.confirmedAt ? "confirmed" : m.approvedAt ? "approved" : "applied",
      checkMode: m?.checkMode ?? null,
    };
  });
}

const rsvpDeadline = (startsAt: Date, set: Date | null) => {
  const weekBefore = new Date(startsAt.getTime() - RSVP_MIN_DAYS_BEFORE * 24 * 60 * 60_000);
  return set && set < weekBefore ? set : weekBefore;
};

async function myCompany(actor: ApiUser) {
  const co = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  if (!co) throw new ApiError(400, "Create your company profile first");
  return co;
}

/** One click: apply to an event, and say whether you need a skill check there. */
export async function applyToEvent(actor: ApiUser, eventId: string, checkMode: CheckMode = "required") {
  const co = await myCompany(actor);
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) throw new ApiError(404, "Event not found");
  const existing = await db.query.eventCompanies.findFirst({ where: and(eq(eventCompanies.eventId, eventId), eq(eventCompanies.companyId, co.id)) });
  if (existing) {
    await db.update(eventCompanies).set({ checkMode }).where(eq(eventCompanies.id, existing.id));
  } else {
    await db.insert(eventCompanies).values({ eventId, companyId: co.id, checkMode });
    const myNeeds = await db.select({ id: needs.id }).from(needs).where(eq(needs.companyId, co.id));
    if (myNeeds.length) await db.insert(eventNeeds).values(myNeeds.map((n) => ({ eventId, needId: n.id })));
  }
  await audit(actor, existing ? "event.check_mode_changed" : "event.applied", { targetType: "event", targetId: eventId, meta: { checkMode } });
  return { applied: true, checkMode };
}

/** Confirm attendance: only after the City approved, and at least 1 week before the event. */
export async function confirmAttendance(actor: ApiUser, eventId: string) {
  const co = await myCompany(actor);
  const row = await db.query.eventCompanies.findFirst({ where: and(eq(eventCompanies.eventId, eventId), eq(eventCompanies.companyId, co.id)) });
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!row || !event) throw new ApiError(404, "Apply to the event first");
  if (!row.approvedAt) throw new ApiError(409, "The City has not approved your participation yet");
  if (Date.now() > rsvpDeadline(event.startsAt, event.rsvpDeadline).getTime())
    throw new ApiError(409, `Attendance must be confirmed at least ${RSVP_MIN_DAYS_BEFORE} days before the event`);
  await db.update(eventCompanies).set({ confirmedAt: new Date(), confirmedBy: actor.id }).where(eq(eventCompanies.id, row.id));
  await audit(actor, "event.attendance_confirmed", { targetType: "event", targetId: eventId });
  return { confirmed: true };
}

/** City: companies that applied to an event. */
export async function eventApplications(eventId: string) {
  return db
    .select({ id: eventCompanies.id, company: companies.name, checkMode: eventCompanies.checkMode, appliedAt: eventCompanies.appliedAt, approvedAt: eventCompanies.approvedAt, confirmedAt: eventCompanies.confirmedAt })
    .from(eventCompanies)
    .innerJoin(companies, eq(eventCompanies.companyId, companies.id))
    .where(eq(eventCompanies.eventId, eventId))
    .orderBy(eventCompanies.appliedAt);
}

export async function approveCompany(actor: ApiUser, eventCompanyId: string) {
  const [row] = await db.update(eventCompanies).set({ approvedAt: new Date(), approvedBy: actor.id }).where(eq(eventCompanies.id, eventCompanyId)).returning();
  if (!row) throw new ApiError(404, "Application not found");
  await audit(actor, "event.company_approved", { targetType: "event", targetId: row.eventId, meta: { companyId: row.companyId } });
  return row;
}

/** City: "per_company" (each company decides) or "none" (open event, no skill checks for anyone). */
export async function setEventPolicy(actor: ApiUser, eventId: string, checkPolicy: "per_company" | "none") {
  const [row] = await db.update(events).set({ checkPolicy }).where(eq(events.id, eventId)).returning();
  if (!row) throw new ApiError(404, "Event not found");
  await audit(actor, "event.policy_changed", { targetType: "event", targetId: eventId, meta: { checkPolicy } });
  return row;
}

/** Does this company need a skill check at its next event? (event policy wins, then the company's choice) */
export async function effectiveCheckMode(companyId: string): Promise<CheckMode> {
  const [row] = await db
    .select({ policy: events.checkPolicy, mode: eventCompanies.checkMode })
    .from(eventCompanies)
    .innerJoin(events, eq(eventCompanies.eventId, events.id))
    .where(eq(eventCompanies.companyId, companyId))
    .orderBy(events.startsAt)
    .limit(1);
  if (!row) return "required";
  return row.policy === "none" ? "off" : row.mode;
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
  const raw = await thinkJsonRaw(
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
