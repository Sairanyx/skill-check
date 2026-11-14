import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db, companies, needs, skillChecks, decisions, bookings, slots, rooms, user } from "@/db";
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
    .select({ startsAt: slots.startsAt, room: rooms.name, alias: user.name, email: user.email, need: needs.title, checkId: bookings.checkId })
    .from(bookings)
    .innerJoin(companies, eq(bookings.companyId, companies.id))
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(rooms, eq(slots.roomId, rooms.id))
    .innerJoin(user, eq(bookings.candidateId, user.id))
    .innerJoin(skillChecks, eq(bookings.checkId, skillChecks.id))
    .innerJoin(needs, eq(skillChecks.needId, needs.id))
    .where(eq(companies.ownerId, actor.id))
    .orderBy(slots.startsAt);
}

export async function bookingForCheck(checkId: string) {
  const [b] = await db
    .select({ startsAt: slots.startsAt, room: rooms.name, email: user.email })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(rooms, eq(slots.roomId, rooms.id))
    .innerJoin(user, eq(bookings.candidateId, user.id))
    .where(eq(bookings.checkId, checkId));
  return b ?? null;
}

