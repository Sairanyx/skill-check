/**
 * Synthetic demo data. Run: npm run db:seed  (safe to re-run: it skips what already exists)
 * No real people or companies. All passwords are DEMO_PASSWORD.
 */
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, user, companies, needs, events, rooms, slots, eventCompanies, checkSessions, sessionBookings } from "@/db";
import { DEMO_NEEDS } from "@/lib/demo-data";

const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "junction2026"; // set SEED_PASSWORD for the live demo

const people = [
  { email: "aino@demo.skillcheck.fi", name: "Candidate 7F2A", role: "candidate" },
  { email: "recruiter@nordiclogistics.demo", name: "Nordic Logistics", role: "company" },
  { email: "recruiter@tapiolacloud.demo", name: "Tapiola Cloud", role: "company" },
  { email: "events@espoo.demo", name: "City of Espoo", role: "city" },
] as const;

async function ensureUser(p: (typeof people)[number]) {
  const existing = await db.query.user.findFirst({ where: eq(user.email, p.email) });
  if (!existing) await auth.api.signUpEmail({ body: { email: p.email, name: p.name, password: DEMO_PASSWORD } });
  await db.update(user).set({ role: p.role }).where(eq(user.email, p.email)); // role set server-side only
  return (await db.query.user.findFirst({ where: eq(user.email, p.email) }))!;
}

async function main() {
  const [aino, nordic, tapiola, city] = await Promise.all(people.map(ensureUser));

  // Companies + needs (ids match the demo-data ids so existing links keep working)
  const owners = { "Nordic Logistics Oy": nordic.id, "Tapiola Cloud Oy": tapiola.id } as Record<string, string>;
  for (const n of DEMO_NEEDS) {
    let company = await db.query.companies.findFirst({ where: eq(companies.name, n.company) });
    if (!company) {
      [company] = await db.insert(companies).values({ name: n.company, ownerId: owners[n.company], sector: "Tech" }).returning();
    }
    const has = await db.query.needs.findFirst({ where: eq(needs.id, n.id) });
    if (!has) {
      await db.insert(needs).values({
        id: n.id, companyId: company.id, title: n.title, summary: n.summary, skills: n.skills,
        level: n.level, source: "written", confirmedBy: owners[n.company], confirmedAt: new Date(),
      });
    }
  }

  // One event with two rooms and 10-minute slots
  let event = await db.query.events.findFirst({ where: eq(events.title, "Espoo Tech Talent Day") });
  if (!event) {
    [event] = await db.insert(events).values({
      title: "Espoo Tech Talent Day", startsAt: new Date("2026-11-27T13:00:00+02:00"),
      mode: "hybrid", location: "Espoo, Finland",
    }).returning();
    const created = await db.insert(rooms).values([{ eventId: event.id, name: "Room A" }, { eventId: event.id, name: "Room B" }]).returning();
    const start = new Date("2026-11-27T13:00:00+02:00").getTime();
    await db.insert(slots).values(
      created.flatMap((room) =>
        Array.from({ length: 12 }, (_, i) => ({
          eventId: event!.id, roomId: room.id,
          startsAt: new Date(start + i * 10 * 60_000), endsAt: new Date(start + (i + 1) * 10 * 60_000),
        })),
      ),
    );
    const all = await db.select().from(companies);
    await db.insert(eventCompanies).values(all.map((c) => ({ eventId: event!.id, companyId: c.id })));
  }

  // Skill-check sessions run by the City (checks are only possible inside an open session)
  const existingSessions = await db.select().from(checkSessions);
  if (!existingSessions.length) {
    const now = Date.now();
    const [onSite] = await db
      .insert(checkSessions)
      .values([
        {
          title: "Skill checks: Tech Talent Day", mode: "on_site", venue: "Espoo Employment Services, Leppävaara",
          room: "Room 2", startsAt: new Date(now - 60 * 60_000), endsAt: new Date(now + 10 * 60 * 60_000),
          capacity: 12, createdBy: city.id,
        },
        {
          title: "Skill checks: online room", mode: "online", venue: "City of Espoo online room",
          room: "Hosted video room, link sent after booking", startsAt: new Date(now + 24 * 60 * 60_000),
          endsAt: new Date(now + 27 * 60 * 60_000), capacity: 20, createdBy: city.id,
        },
      ])
      .returning();
    await db.insert(sessionBookings).values({ sessionId: onSite.id, candidateId: aino.id });
  }

  console.log("Seeded. Log in with any of:");
  for (const p of people) console.log(`  ${p.role.padEnd(9)} ${p.email}  /  ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
