/**
 * Synthetic demo data. Run on an empty database: npm run db:reset -- --yes && npm run db:seed
 * No real people or companies. All passwords are DEMO_PASSWORD.
 */
import { and, eq, lte, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  db, user, companies, needs, events, eventCompanies, eventNeeds, meetingRooms, meetingSlots,
  venues, testRooms, workstations, testSlots, appointments, type QuestionBank,
} from "@/db";
import { mapToEsco } from "@/lib/esco";
import { generateAnchors } from "@/lib/ai/rubric";

const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "junction2026"; // set SEED_PASSWORD for the live demo
const MEETING_MIN = 15; // same as Espoo's TalentMatch meetings
const MIN = 60_000;

const people = [
  { email: "aino@demo.skillcheck.fi", name: "Aino Mäkelä", role: "candidate" },
  { email: "recruiter@kauklahtiparcel.demo", name: "Kauklahti Parcel", role: "company" },
  { email: "recruiter@tapiolacloud.demo", name: "Tapiola Cloud", role: "company" },
  { email: "hello@kivenlahtibakery.demo", name: "Kivenlahti Bakery", role: "company" },
  { email: "events@espoo.demo", name: "City of Espoo", role: "city" },
] as const;

async function ensureUser(p: (typeof people)[number]) {
  const existing = await db.query.user.findFirst({ where: eq(user.email, p.email) });
  if (!existing) await auth.api.signUpEmail({ body: { email: p.email, name: p.name, password: DEMO_PASSWORD } });
  await db.update(user).set({ role: p.role }).where(eq(user.email, p.email)); // role set server-side only
  return (await db.query.user.findFirst({ where: eq(user.email, p.email) }))!;
}

const nordicBank: QuestionBank = {
  junior: ["How would you find duplicate rows in a table of parcel scans?"],
  mid: [
    "Our three depot systems log timestamps differently. How would you combine them before analysing delays?",
    "A manager asks why Tuesdays are late. What would you check first, and why?",
  ],
  senior: ["How would you set up delay reporting so the depots trust the numbers?"],
};

/** Start of the current 30-minute block, so one slot is running right now for the demo. */
function blockStart(d = new Date()) {
  const t = new Date(d);
  t.setUTCSeconds(0, 0);
  t.setUTCMinutes(t.getUTCMinutes() < 30 ? 0 : 30);
  return t;
}

async function main() {
  const [aino, nordic, tapiola, bakery] = await Promise.all(people.map(ensureUser));

  // Companies and needs
  const [nordicCo, tapiolaCo, bakeryCo] = await db
    .insert(companies)
    .values([
      { name: "Kauklahti Parcel Oy", ownerId: nordic.id, sector: "Logistics", website: "https://kauklahtiparcel.demo", description: "Fictional company for the Skill Check demo. Parcel delivery with three depots in the Helsinki region." },
      { name: "Tapiola Cloud Oy", ownerId: tapiola.id, sector: "Software", website: "https://tapiolacloud.demo", description: "Fictional company for the Skill Check demo. Runs cloud platforms for Finnish retail companies." },
      { name: "Kivenlahti Bakery Oy", ownerId: bakery.id, sector: "Food", description: "Fictional company for the Skill Check demo. Family bakery with two shops in Espoo." },
    ])
    .returning();

  const needRows = [
    {
      id: "nordic-logistics-data", companyId: nordicCo.id, title: "Data analyst: delivery delays",
      summary: "Our delivery data is messy: duplicate scans, missing timestamps, three different depot systems. We need someone who can clean it, find why deliveries are late and explain it to non-technical managers.",
      skills: ["data cleaning", "SQL", "Python or Excel", "root-cause analysis", "explaining results"], level: "mid" as const,
      checkMode: "required" as const, questionBank: nordicBank, questionBankReview: { ok: true, problems: [] },
      owner: nordic.id,
    },
    {
      id: "espoo-cloud-platform", companyId: tapiolaCo.id, title: "Cloud engineer: cost control",
      summary: "Our cloud bill grew 40% in a year. We need someone who can find the waste, automate scaling and keep services reliable while costs go down.",
      skills: ["Kubernetes", "cloud cost optimisation", "monitoring", "automation", "trade-off reasoning"], level: "mid" as const,
      checkMode: "optional" as const, questionBank: null, questionBankReview: null, owner: tapiola.id,
    },
    {
      id: "bakery-shift-lead", companyId: bakeryCo.id, title: "Shift lead, morning bakery",
      summary: "Lead the 5:00 morning shift in our Espoo bakery shop.",
      skills: ["team leadership", "food hygiene", "customer service"], level: "junior" as const,
      checkMode: "off" as const, questionBank: null, questionBankReview: null, owner: bakery.id,
      proofRequirements: [{ code: "card-hygiene", required: true }, { code: "card-first-aid", required: false }], // hygiene passport: required by law for unpacked food
    },
  ];
  for (const { owner, ...n } of needRows) {
    const [escoSkills, anchors] = await Promise.all([mapToEsco(n.skills, `${n.title}: ${n.summary}`), generateAnchors(n)]);
    await db.insert(needs).values({ ...n, escoSkills, anchors, confirmedBy: owner, confirmedAt: new Date() });
  }

  // The City's recruitment event: companies confirm attendance before the RSVP deadline
  const eventStart = new Date("2026-11-27T13:00:00+02:00");
  const [event] = await db
    .insert(events)
    .values({ title: "Espoo Tech Talent Day", startsAt: eventStart, rsvpDeadline: new Date("2026-11-20T16:00:00+02:00"), mode: "in_person", location: "Espoo, Finland" })
    .returning();
  const now = new Date();
  await db.insert(eventCompanies).values([
    { eventId: event.id, companyId: nordicCo.id, checkMode: "required", approvedAt: now, confirmedAt: now, confirmedBy: nordic.id },
    { eventId: event.id, companyId: tapiolaCo.id, checkMode: "optional", approvedAt: now, confirmedAt: now, confirmedBy: tapiola.id },
    { eventId: event.id, companyId: bakeryCo.id, checkMode: "off" }, // applied, waiting for City approval
  ]);
  await db.insert(eventNeeds).values(needRows.map((n) => ({ eventId: event.id, needId: n.id })));
  const mRooms = await db.insert(meetingRooms).values([{ eventId: event.id, name: "Room A" }, { eventId: event.id, name: "Room B" }]).returning();
  await db.insert(meetingSlots).values(
    mRooms.flatMap((room) =>
      Array.from({ length: 12 }, (_, i) => ({
        eventId: event.id, roomId: room.id,
        startsAt: new Date(eventStart.getTime() + i * MEETING_MIN * MIN), endsAt: new Date(eventStart.getTime() + (i + 1) * MEETING_MIN * MIN),
      })),
    ),
  );

  // Two more events to choose from: online and hybrid. No company has applied yet.
  const more = await db
    .insert(events)
    .values([
      { title: "Espoo Online Job Fair", startsAt: new Date("2026-12-04T14:00:00+02:00"), mode: "online", location: "Online, video meetings" },
      { title: "Espoo Hybrid Recruitment Day", startsAt: new Date("2026-12-11T10:00:00+02:00"), mode: "hybrid", location: "Espoo and online" },
    ])
    .returning();
  for (const e of more) {
    const names = e.mode === "online" ? ["Video room 1", "Video room 2"] : ["Room A", "Video room 1"];
    const rooms = await db.insert(meetingRooms).values(names.map((name) => ({ eventId: e.id, name }))).returning();
    await db.insert(meetingSlots).values(
      rooms.flatMap((room) =>
        Array.from({ length: 12 }, (_, i) => ({
          eventId: e.id, roomId: room.id,
          startsAt: new Date(e.startsAt.getTime() + i * MEETING_MIN * MIN), endsAt: new Date(e.startsAt.getTime() + (i + 1) * MEETING_MIN * MIN),
        })),
      ),
    );
  }

  // Testing rooms (EXAM-room model): venues → rooms → workstations → 30 min slots
  const [lepp, ota] = await db
    .insert(venues)
    .values([
      { name: "Espoo Employment Services, Leppävaara", address: "Leppävaara, Espoo" },
      { name: "Otaniemi EXAM Room", address: "Otaniemi, Espoo" },
    ])
    .returning();
  const rooms = await db.insert(testRooms).values([{ venueId: lepp.id, name: "EXAM room A" }, { venueId: ota.id, name: "EXAM room B" }]).returning();
  const stations = await db
    .insert(workstations)
    .values(rooms.flatMap((r) => [1, 2, 3, 4].map((n) => ({ roomId: r.id, label: `Workstation ${n}` }))))
    .returning();

  // Slots: from the current 30-min block, for 3 days, every half hour (a real deployment would follow opening hours)
  const first = blockStart();
  const slotsPerStation = 3 * 24 * 2;
  for (const ws of stations) {
    await db.insert(testSlots).values(
      Array.from({ length: slotsPerStation }, (_, i) => ({
        workstationId: ws.id,
        startsAt: new Date(first.getTime() + i * 30 * MIN),
        endsAt: new Date(first.getTime() + (i + 1) * 30 * MIN),
      })),
    );
  }

  // Aino is booked on Leppävaara Workstation 1, in the slot running right now
  const ws1 = stations[0];
  const [nowSlot] = await db
    .select()
    .from(testSlots)
    .where(and(eq(testSlots.workstationId, ws1.id), lte(testSlots.startsAt, new Date()), gt(testSlots.endsAt, new Date())));
  await db.insert(appointments).values({ candidateId: aino.id, slotId: nowSlot.id, needIds: ["nordic-logistics-data", "espoo-cloud-platform"] });

  console.log("Seeded. Log in with any of:");
  for (const p of people) console.log(`  ${p.role.padEnd(9)} ${p.email}  /  ${DEMO_PASSWORD}`);
  console.log(`Aino is booked now on ${lepp.name}, ${rooms[0].name}, ${ws1.label}. Enroll that computer as City staff first.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
