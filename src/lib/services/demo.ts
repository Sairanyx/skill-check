import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, appointments, companies, needs, testRooms, testSlots, user, venues, workstations } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import { audit } from "./audit";
import { enrollWorkstation } from "./testing";

/**
 * DEMO ONLY: "Try a skill check" on /demo, for judges and visitors.
 * In real use a person books a time ahead and City staff set up the EXAM room computer.
 * Here we do the same steps at once, for a fresh visitor account: a computer of its own in a demo
 * EXAM room, a 30-minute slot starting now, a booking, and this browser set up as that computer.
 * The normal rules are untouched: the check still runs only on that computer, in that slot.
 */
// By title: some need ids are generated when the database is seeded, titles stay the same.
const DEMO_TRY_TITLES = ["Data analyst: delivery delays", "Construction worker: formwork and concrete", "Delivery driver: last-mile parcels"];
export const DEMO_VISIT_MINUTES = 30;

const DEMO_VENUE = "SkillCheck demo";
const DEMO_ROOM = "Try-it EXAM room";

/** The jobs a visitor can try, in a fixed order. */
export async function demoTryNeeds() {
  const rows = await db
    .select({ id: needs.id, title: needs.title, company: companies.name })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .where(inArray(needs.title, DEMO_TRY_TITLES));
  return DEMO_TRY_TITLES.map((t) => rows.find((r) => r.title === t)).filter((r) => !!r);
}

/** The job to try: the chosen one if it is part of the demo, otherwise a random one. Checked before any account is made. */
export async function pickDemoNeed(chosen?: string | null) {
  const options = await demoTryNeeds();
  if (!options.length) throw new ApiError(500, "The demo jobs are missing. Please try again later.");
  if (chosen) {
    if (!options.some((o) => o.id === chosen)) throw new ApiError(400, "This job is not part of the demo");
    return chosen;
  }
  return options[Math.floor(Math.random() * options.length)].id;
}

async function demoRoom() {
  const existing = await db
    .select({ id: testRooms.id })
    .from(testRooms)
    .innerJoin(venues, eq(testRooms.venueId, venues.id))
    .where(and(eq(venues.name, DEMO_VENUE), eq(testRooms.name, DEMO_ROOM)));
  if (existing[0]) return existing[0].id;
  const [venue] = await db.insert(venues).values({ name: DEMO_VENUE, address: "Online demo, skillcheck.fi/demo" }).returning();
  const [room] = await db.insert(testRooms).values({ venueId: venue.id, name: DEMO_ROOM }).returning();
  return room.id;
}

/** Books `visitor` into a slot starting now on a new demo computer. Returns the kiosk token for this browser. */
export async function openDemoVisit(visitor: ApiUser, needId: string) {
  await pickDemoNeed(needId); // only demo jobs
  const city = await db.query.user.findFirst({ where: eq(user.role, "city") });
  if (!city) throw new ApiError(500, "The demo needs a City account to set up the computer");

  const roomId = await demoRoom();
  const [ws] = await db.insert(workstations).values({ roomId, label: `Computer for ${visitor.name}` }).returning();
  const now = Date.now();
  const [slot] = await db
    .insert(testSlots)
    .values({ workstationId: ws.id, startsAt: new Date(now - 60_000), endsAt: new Date(now + DEMO_VISIT_MINUTES * 60_000) })
    .returning();
  const [booking] = await db.insert(appointments).values({ candidateId: visitor.id, slotId: slot.id, needIds: [needId] }).returning();
  await audit(visitor, "appointment.booked", { subjectId: visitor.id, targetType: "appointment", targetId: booking.id, meta: { slotId: slot.id, needIds: [needId], demo: true } });

  const { token } = await enrollWorkstation({ id: city.id, name: city.name, email: city.email, role: "city" }, ws.id);
  return token;
}
