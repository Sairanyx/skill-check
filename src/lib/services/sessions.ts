import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, count, eq } from "drizzle-orm";
import { db, checkSessions, sessionBookings } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { audit } from "./audit";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, easy to read on a screen
const newCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

const isOpen = (s: typeof checkSessions.$inferSelect) => !!s.accessCode && !!s.openedAt && !s.closedAt;

/** Sessions with how many seats are taken. Never includes the room code. */
export async function listSessions() {
  const rows = await db
    .select({
      id: checkSessions.id,
      title: checkSessions.title,
      mode: checkSessions.mode,
      venue: checkSessions.venue,
      room: checkSessions.room,
      startsAt: checkSessions.startsAt,
      endsAt: checkSessions.endsAt,
      capacity: checkSessions.capacity,
      openedAt: checkSessions.openedAt,
      closedAt: checkSessions.closedAt,
      booked: count(sessionBookings.id),
    })
    .from(checkSessions)
    .leftJoin(sessionBookings, eq(sessionBookings.sessionId, checkSessions.id))
    .groupBy(checkSessions.id)
    .orderBy(asc(checkSessions.startsAt));
  return rows.map((r) => ({ ...r, open: !!r.openedAt && !r.closedAt }));
}

export async function createSession(
  actor: ApiUser,
  input: { title: string; mode?: "on_site" | "online"; venue: string; room: string; startsAt: string; endsAt: string; capacity?: number },
) {
  if (!input.title || !input.venue || !input.room || !input.startsAt || !input.endsAt)
    throw new ApiError(400, "title, venue, room, startsAt and endsAt are required");
  const [row] = await db
    .insert(checkSessions)
    .values({
      title: input.title,
      mode: input.mode === "online" ? "online" : "on_site",
      venue: input.venue,
      room: input.room,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: input.capacity ?? 10,
      createdBy: actor.id,
    })
    .returning();
  await audit(actor, "session.created", { targetType: "check_session", targetId: row.id });
  return row;
}

/** City staff open the room: a fresh code is generated and shown on the room screen. */
export async function openSession(actor: ApiUser, sessionId: string) {
  const code = newCode();
  const [row] = await db
    .update(checkSessions)
    .set({ accessCode: code, openedAt: new Date(), closedAt: null })
    .where(eq(checkSessions.id, sessionId))
    .returning();
  if (!row) throw new ApiError(404, "Session not found");
  // New code = everyone must be in the room again: earlier check-ins no longer count.
  await db.update(sessionBookings).set({ checkedInAt: null }).where(eq(sessionBookings.sessionId, sessionId));
  await audit(actor, "session.opened", { targetType: "check_session", targetId: sessionId });
  return { id: row.id, accessCode: code };
}

export async function closeSession(actor: ApiUser, sessionId: string) {
  const [row] = await db.update(checkSessions).set({ closedAt: new Date() }).where(eq(checkSessions.id, sessionId)).returning();
  if (!row) throw new ApiError(404, "Session not found");
  await audit(actor, "session.closed", { targetType: "check_session", targetId: sessionId });
  return { id: row.id, closed: true };
}

/** Room screen for City staff: the current code. */
export async function sessionCode(sessionId: string) {
  const s = await db.query.checkSessions.findFirst({ where: eq(checkSessions.id, sessionId) });
  if (!s) throw new ApiError(404, "Session not found");
  return { id: s.id, title: s.title, venue: s.venue, room: s.room, open: isOpen(s), accessCode: isOpen(s) ? s.accessCode : null };
}

export async function bookSession(actor: ApiUser, sessionId: string) {
  const s = await db.query.checkSessions.findFirst({ where: eq(checkSessions.id, sessionId) });
  if (!s || s.closedAt) throw new ApiError(404, "Session not found");
  const mine = await db.query.sessionBookings.findFirst({
    where: and(eq(sessionBookings.sessionId, sessionId), eq(sessionBookings.candidateId, actor.id)),
  });
  if (mine) return mine;
  const [{ taken }] = await db.select({ taken: count() }).from(sessionBookings).where(eq(sessionBookings.sessionId, sessionId));
  if (taken >= s.capacity) throw new ApiError(409, "This session is full");
  const [row] = await db.insert(sessionBookings).values({ sessionId, candidateId: actor.id }).returning();
  await audit(actor, "session.booked", { subjectId: actor.id, targetType: "check_session", targetId: sessionId });
  return row;
}

export async function mySessions(actor: ApiUser) {
  return db
    .select({
      bookingId: sessionBookings.id,
      checkedInAt: sessionBookings.checkedInAt,
      id: checkSessions.id,
      title: checkSessions.title,
      mode: checkSessions.mode,
      venue: checkSessions.venue,
      room: checkSessions.room,
      startsAt: checkSessions.startsAt,
      endsAt: checkSessions.endsAt,
      openedAt: checkSessions.openedAt,
      closedAt: checkSessions.closedAt,
    })
    .from(sessionBookings)
    .innerJoin(checkSessions, eq(sessionBookings.sessionId, checkSessions.id))
    .where(eq(sessionBookings.candidateId, actor.id))
    .orderBy(asc(checkSessions.startsAt));
}

/** Candidate is in the room and types the code shown there. */
export async function checkIn(actor: ApiUser, sessionId: string, code: string) {
  const s = await db.query.checkSessions.findFirst({ where: eq(checkSessions.id, sessionId) });
  const booking = await db.query.sessionBookings.findFirst({
    where: and(eq(sessionBookings.sessionId, sessionId), eq(sessionBookings.candidateId, actor.id)),
  });
  if (!s || !booking) throw new ApiError(404, "You have not booked this session");
  if (!isOpen(s)) throw new ApiError(409, "This session is not open right now");
  if ((code ?? "").trim().toUpperCase() !== s.accessCode) {
    await audit(actor, "session.checkin_failed", { subjectId: actor.id, targetType: "check_session", targetId: sessionId });
    throw new ApiError(403, "Wrong room code");
  }
  await db.update(sessionBookings).set({ checkedInAt: new Date() }).where(eq(sessionBookings.id, booking.id));
  await audit(actor, "session.checked_in", { subjectId: actor.id, targetType: "check_session", targetId: sessionId });
  return { checkedIn: true };
}

/** Throws unless the candidate is checked in to an open session. Used before any skill check starts. */
export async function assertInSession(actor: ApiUser, sessionId: string) {
  const s = await db.query.checkSessions.findFirst({ where: eq(checkSessions.id, sessionId) });
  const booking = await db.query.sessionBookings.findFirst({
    where: and(eq(sessionBookings.sessionId, sessionId), eq(sessionBookings.candidateId, actor.id)),
  });
  if (!s || !booking) throw new ApiError(403, "Book a session with the City of Espoo first");
  if (!isOpen(s)) throw new ApiError(403, "Skill checks can only be taken during an open session");
  if (!booking.checkedInAt) throw new ApiError(403, "Enter the room code shown at the venue first");
}

