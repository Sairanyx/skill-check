import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { db, appointments, auditEvents, bookings, decisions, evaluations, events, eventCompanies, meetingRooms, meetingSlots, companies, skillChecks, testRooms, testSlots, user, venues, workstations } from "@/db";
import { aliasFor } from "@/lib/alias";
import { loadNeed } from "@/lib/services/needs";
import { demoTryNeeds } from "@/lib/services/demo";
import { DemoStory, type Story } from "@/components/demo/demo-story";

/**
 * /demo: the story in six short steps with real demo data, then a real skill check to try.
 * The platform itself (logins for jobseekers, companies and the City) works on its own, without this page.
 */
export default async function DemoPage({ params }: PageProps<"/[lang]/demo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection(); // live demo data on every visit, never at build time

  const options = await demoTryNeeds();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <DemoStory lang={lang} story={await ainoStory()} tryNeeds={options} />
    </div>
  );
}

/** Aino's finished check and what happened around it, read from the demo database. */
async function ainoStory(): Promise<Story | null> {
  const [check] = await db
    .select({ id: skillChecks.id, needId: skillChecks.needId, turns: skillChecks.turns, candidateId: skillChecks.candidateId, appointmentId: skillChecks.appointmentId })
    .from(skillChecks)
    .innerJoin(user, eq(user.id, skillChecks.candidateId))
    .where(and(eq(user.email, "aino@demo.skillcheck.fi"), isNotNull(skillChecks.finishedAt)))
    .orderBy(desc(skillChecks.finishedAt))
    .limit(1);
  if (!check) return null;
  const [event] = await db.select({ id: events.id, title: events.title, startsAt: events.startsAt }).from(events).where(eq(events.title, "Espoo Tech Talent Day")).limit(1);
  const coming = event
    ? await db
        .select({ name: companies.name, mode: eventCompanies.checkMode })
        .from(eventCompanies)
        .innerJoin(companies, eq(eventCompanies.companyId, companies.id))
        .where(and(eq(eventCompanies.eventId, event.id), isNotNull(eventCompanies.confirmedAt)))
    : [];
  const [need, [ev], [room], [decision], [meeting], log] = await Promise.all([
    loadNeed(check.needId),
    db.select().from(evaluations).where(eq(evaluations.checkId, check.id)),
    check.appointmentId
      ? db
          .select({ startsAt: testSlots.startsAt, endsAt: testSlots.endsAt, room: testRooms.name, venue: venues.name, workstation: workstations.label })
          .from(appointments)
          .innerJoin(testSlots, eq(appointments.slotId, testSlots.id))
          .innerJoin(workstations, eq(testSlots.workstationId, workstations.id))
          .innerJoin(testRooms, eq(workstations.roomId, testRooms.id))
          .innerJoin(venues, eq(testRooms.venueId, venues.id))
          .where(eq(appointments.id, check.appointmentId))
      : Promise.resolve([]),
    db.select({ decision: decisions.decision, note: decisions.note }).from(decisions).where(and(eq(decisions.checkId, check.id), eq(decisions.role, "company"))).orderBy(desc(decisions.createdAt)).limit(1),
    db
      .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name })
      .from(bookings)
      .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
      .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
      .where(eq(bookings.checkId, check.id)),
    db.select({ at: auditEvents.at, role: auditEvents.actorRole, action: auditEvents.action, purpose: auditEvents.purpose }).from(auditEvents).where(eq(auditEvents.targetId, check.id)).orderBy(desc(auditEvents.at)).limit(4),
  ]);
  const turns = (check.turns as { question: string; said?: string; seen: string }[]).slice(0, 3);
  return {
    event: event ? { title: event.title, startsAt: event.startsAt.toISOString(), companies: coming.length, joining: coming.slice(0, 4) } : null,
    need: { company: need.company, title: need.title, summary: need.summary, skills: need.skills },
    room: room ? { ...room, startsAt: room.startsAt.toISOString(), endsAt: room.endsAt.toISOString() } : null,
    turns: turns.map((t) => ({ question: t.question, said: t.said ?? "", seen: t.seen })),
    evaluation: ev
      ? {
          match: ev.match,
          level: ev.level,
          confidence: ev.confidence,
          skills: ((ev.rubric ?? []) as { criterion: string; score: number; evidence: string[] }[]).slice(0, 3).map((r) => ({ skill: r.criterion, score: r.score, quote: r.evidence[0] ?? null })),
        }
      : null,
    alias: aliasFor(check.candidateId),
    decision: decision ? { accepted: decision.decision === "invite", note: decision.note } : null,
    meeting: meeting ? { startsAt: meeting.startsAt.toISOString(), room: meeting.room } : null,
    log: log.map((l) => ({ at: l.at.toISOString(), role: l.role, action: l.action, purpose: l.purpose })),
  };
}
