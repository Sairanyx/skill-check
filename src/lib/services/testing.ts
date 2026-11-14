import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq, gt, inArray, isNull, lte, gte, notInArray } from "drizzle-orm";
import { db, venues, testRooms, workstations, testSlots, appointments, needs, companies } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { audit } from "./audit";
import { effectiveCheckMode } from "./company";

/**
 * Testing rooms, EXAM-room style: venue → room → workstation (locked kiosk) → 30 min slot.
 * Skill checks only run on the booked workstation during the booked slot.
 */
export const KIOSK_COOKIE = "sc_kiosk";
export const MAX_NEEDS_PER_APPOINTMENT = 3;
export const RESCHEDULE_DEADLINE_MS = 2 * 60 * 60_000; // 2 hours before start
export const MAX_RESCHEDULES = 2;
export const LOGIN_GRACE_MS = 10 * 60_000; // may log in 10 min before the slot starts

const ACTIVE = ["booked", "in_progress"] as const;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/* ---------- availability ---------- */

/** Free slots from now on, grouped by venue and room. */
export async function freeTestSlots(opts: { from?: Date; days?: number } = {}) {
  const from = opts.from ?? new Date();
  const to = new Date(from.getTime() + (opts.days ?? 3) * 24 * 60 * 60_000);
  const taken = db.select({ id: appointments.slotId }).from(appointments).where(inArray(appointments.status, [...ACTIVE]));
  return db
    .select({
      slotId: testSlots.id,
      startsAt: testSlots.startsAt,
      endsAt: testSlots.endsAt,
      workstation: workstations.label,
      room: testRooms.name,
      venue: venues.name,
      address: venues.address,
    })
    .from(testSlots)
    .innerJoin(workstations, eq(testSlots.workstationId, workstations.id))
    .innerJoin(testRooms, eq(workstations.roomId, testRooms.id))
    .innerJoin(venues, eq(testRooms.venueId, venues.id))
    .where(and(gt(testSlots.startsAt, from), lte(testSlots.startsAt, to), notInArray(testSlots.id, taken), isNull(workstations.revokedAt)))
    .orderBy(asc(testSlots.startsAt), asc(venues.name), asc(workstations.label))
    .limit(400);
}

async function slotOrThrow(slotId: string) {
  const slot = await db.query.testSlots.findFirst({ where: eq(testSlots.id, slotId) });
  if (!slot) throw new ApiError(404, "Time slot not found");
  const busy = await db.query.appointments.findFirst({
    where: and(eq(appointments.slotId, slotId), inArray(appointments.status, [...ACTIVE])),
  });
  if (busy) throw new ApiError(409, "That time is already taken");
  if (slot.startsAt.getTime() <= Date.now()) throw new ApiError(400, "That time has already started");
  return slot;
}

async function validNeeds(needIds: string[]) {
  const ids = [...new Set(needIds ?? [])];
  if (!ids.length) throw new ApiError(400, "Choose at least one company need");
  if (ids.length > MAX_NEEDS_PER_APPOINTMENT) throw new ApiError(400, `At most ${MAX_NEEDS_PER_APPOINTMENT} needs per booking`);
  const rows = await db.select({ id: needs.id, companyId: needs.companyId }).from(needs).where(inArray(needs.id, ids));
  if (rows.length !== ids.length) throw new ApiError(400, "Unknown need");
  for (const r of rows)
    if ((await effectiveCheckMode(r.companyId)) === "off") throw new ApiError(400, "One of these companies does not need a skill check, just come to the event");
  return ids;
}

/* ---------- appointments ---------- */

export async function bookAppointment(actor: ApiUser, slotId: string, needIds: string[]) {
  const ids = await validNeeds(needIds);
  await slotOrThrow(slotId);
  const [row] = await db.insert(appointments).values({ candidateId: actor.id, slotId, needIds: ids }).returning();
  await audit(actor, "appointment.booked", { subjectId: actor.id, targetType: "appointment", targetId: row.id, meta: { slotId, needIds: ids } });
  return row;
}

async function ownAppointment(actor: ApiUser, id: string) {
  const a = await db.query.appointments.findFirst({ where: eq(appointments.id, id) });
  if (!a || a.candidateId !== actor.id) throw new ApiError(404, "Booking not found");
  return a;
}

/** Move to another free slot, until 2 hours before the start, at most twice. */
export async function rescheduleAppointment(actor: ApiUser, id: string, newSlotId: string) {
  const a = await ownAppointment(actor, id);
  if (a.status !== "booked") throw new ApiError(409, "This booking can no longer be changed");
  const slot = await db.query.testSlots.findFirst({ where: eq(testSlots.id, a.slotId) });
  if (slot && slot.startsAt.getTime() - Date.now() < RESCHEDULE_DEADLINE_MS)
    throw new ApiError(409, "Changes are possible until 2 hours before your time");
  if (a.rescheduleCount >= MAX_RESCHEDULES) throw new ApiError(409, `You can change a booking at most ${MAX_RESCHEDULES} times`);
  await slotOrThrow(newSlotId);
  const row = await db.transaction(async (tx) => {
    await tx.update(appointments).set({ status: "rescheduled" }).where(eq(appointments.id, id));
    const [n] = await tx
      .insert(appointments)
      .values({ candidateId: actor.id, slotId: newSlotId, needIds: a.needIds, rescheduleCount: a.rescheduleCount + 1, previousAppointmentId: id })
      .returning();
    return n;
  });
  await audit(actor, "appointment.rescheduled", { subjectId: actor.id, targetType: "appointment", targetId: row.id, meta: { from: id } });
  return row;
}

export async function cancelAppointment(actor: ApiUser, id: string) {
  const a = await ownAppointment(actor, id);
  if (a.status !== "booked") throw new ApiError(409, "This booking can no longer be cancelled");
  const slot = await db.query.testSlots.findFirst({ where: eq(testSlots.id, a.slotId) });
  if (slot && slot.startsAt.getTime() <= Date.now()) throw new ApiError(409, "Your testing time has already started"); // cancel any time before the start
  await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, id));
  await audit(actor, "appointment.cancelled", { subjectId: actor.id, targetType: "appointment", targetId: id });
  return { cancelled: true };
}

/** The candidate's bookings with place, time and the needs they cover. */
export async function myAppointments(actor: ApiUser) {
  const rows = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      needIds: appointments.needIds,
      rescheduleCount: appointments.rescheduleCount,
      startsAt: testSlots.startsAt,
      endsAt: testSlots.endsAt,
      workstation: workstations.label,
      room: testRooms.name,
      venue: venues.name,
      address: venues.address,
    })
    .from(appointments)
    .innerJoin(testSlots, eq(appointments.slotId, testSlots.id))
    .innerJoin(workstations, eq(testSlots.workstationId, workstations.id))
    .innerJoin(testRooms, eq(workstations.roomId, testRooms.id))
    .innerJoin(venues, eq(testRooms.venueId, venues.id))
    .where(and(eq(appointments.candidateId, actor.id), inArray(appointments.status, ["booked", "in_progress", "completed", "no_show"])))
    .orderBy(asc(testSlots.startsAt));
  const allNeedIds = [...new Set(rows.flatMap((r) => r.needIds))];
  const needRows = allNeedIds.length
    ? await db.select({ id: needs.id, title: needs.title, company: companies.name }).from(needs).innerJoin(companies, eq(needs.companyId, companies.id)).where(inArray(needs.id, allNeedIds))
    : [];
  const byId = new Map(needRows.map((n) => [n.id, n]));
  return rows.map((r) => ({ ...r, needs: r.needIds.map((id) => byId.get(id)).filter(Boolean) as typeof needRows }));
}

/* ---------- workstations (kiosk) ---------- */

/** City staff, sitting at the computer, enroll it. Returns the secret for the kiosk cookie. */
export async function enrollWorkstation(actor: ApiUser, workstationId: string) {
  const token = randomBytes(32).toString("base64url");
  const [ws] = await db
    .update(workstations)
    .set({ tokenHash: hash(token), enrolledBy: actor.id, enrolledAt: new Date(), revokedAt: null })
    .where(eq(workstations.id, workstationId))
    .returning();
  if (!ws) throw new ApiError(404, "Workstation not found");
  await audit(actor, "workstation.enrolled", { targetType: "workstation", targetId: ws.id });
  return { workstation: ws, token };
}

export async function workstationFromToken(token: string | null | undefined) {
  if (!token) return null;
  const ws = await db.query.workstations.findFirst({ where: and(eq(workstations.tokenHash, hash(token)), isNull(workstations.revokedAt)) });
  return ws ?? null;
}

export function kioskTokenFromRequest(req: Request) {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.split(/;\s*/).find((c) => c.startsWith(`${KIOSK_COOKIE}=`));
  return m ? decodeURIComponent(m.slice(KIOSK_COOKIE.length + 1)) : null;
}

/** The booking that may use this workstation right now (10 min grace before start), if any. */
export async function currentAppointmentAt(workstationId: string, now = new Date()) {
  const [row] = await db
    .select({ appointment: appointments, slot: testSlots })
    .from(appointments)
    .innerJoin(testSlots, eq(appointments.slotId, testSlots.id))
    .where(
      and(
        eq(testSlots.workstationId, workstationId),
        inArray(appointments.status, [...ACTIVE]),
        lte(testSlots.startsAt, new Date(now.getTime() + LOGIN_GRACE_MS)),
        gte(testSlots.endsAt, now),
      ),
    );
  return row ?? null;
}

/** Throws unless `actor` is the person booked on this workstation right now. Used by kiosk login and every check call. */
export async function assertKioskTurn(actor: ApiUser, workstationToken: string | null | undefined) {
  const ws = await workstationFromToken(workstationToken);
  if (!ws) throw new ApiError(403, "Skill checks can only be taken on a City testing-room computer");
  const now = await currentAppointmentAt(ws.id);
  if (!now || now.appointment.candidateId !== actor.id) throw new ApiError(403, "This workstation is reserved for someone else right now");
  return { workstation: ws, appointment: now.appointment, slot: now.slot };
}

/** For the kiosk screen: which workstation this is and who it is reserved for (time only, no names). */
export async function kioskStatus(token: string | null | undefined) {
  const ws = await workstationFromToken(token);
  if (!ws) return null;
  const room = await db.query.testRooms.findFirst({ where: eq(testRooms.id, ws.roomId) });
  const venue = room ? await db.query.venues.findFirst({ where: eq(venues.id, room.venueId) }) : null;
  const current = await currentAppointmentAt(ws.id);
  const [next] = await db
    .select({ startsAt: testSlots.startsAt, endsAt: testSlots.endsAt })
    .from(appointments)
    .innerJoin(testSlots, eq(appointments.slotId, testSlots.id))
    .where(and(eq(testSlots.workstationId, ws.id), inArray(appointments.status, [...ACTIVE]), gt(testSlots.startsAt, new Date())))
    .orderBy(asc(testSlots.startsAt))
    .limit(1);
  return {
    workstation: ws.label,
    room: room?.name,
    venue: venue?.name,
    current: current ? { startsAt: current.slot.startsAt, endsAt: current.slot.endsAt } : null,
    next: next ?? null,
  };
}

/** City overview: rooms, workstations, enrollment and today's bookings. */
export async function testingOverview() {
  const ws = await db
    .select({ id: workstations.id, label: workstations.label, enrolledAt: workstations.enrolledAt, revokedAt: workstations.revokedAt, room: testRooms.name, venue: venues.name })
    .from(workstations)
    .innerJoin(testRooms, eq(workstations.roomId, testRooms.id))
    .innerJoin(venues, eq(testRooms.venueId, venues.id))
    .orderBy(asc(venues.name), asc(testRooms.name), asc(workstations.label));
  const booked = await db
    .select({ workstationId: testSlots.workstationId, startsAt: testSlots.startsAt, status: appointments.status })
    .from(appointments)
    .innerJoin(testSlots, eq(appointments.slotId, testSlots.id))
    .where(and(inArray(appointments.status, ["booked", "in_progress", "completed", "no_show"]), gte(testSlots.endsAt, new Date(Date.now() - 12 * 60 * 60_000))))
    .orderBy(asc(testSlots.startsAt));
  return ws.map((w) => ({ ...w, bookings: booked.filter((b) => b.workstationId === w.id) }));
}
