import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { db, bookings, companies, eventCompanies, events, evaluations, meetingRooms, meetingSlots, skillChecks, user } from "@/db";
import { aliasFor } from "@/lib/alias";
import { loadNeed } from "@/lib/services/needs";
import { eventApplications } from "@/lib/services/company";
import { auditLog } from "@/lib/services/decisions";
import { freeTestSlots } from "@/lib/services/testing";
import { demoTryNeeds } from "@/lib/services/demo";
import { PageTitle, fmtTime } from "@/components/app/ui";
import { EventCompanies } from "@/components/app/event-companies";
import { BookingForm } from "@/components/app/candidate-actions";
import { CheckRunner } from "@/components/app/check-runner";
import { EvaluationView, type EvaluationData, type SkillAnchor } from "@/components/app/evaluation-view";
import { DecisionLog } from "@/components/app/decision-log";
import { BrowserFrame } from "@/components/demo/browser-frame";
import { DemoStory, type DemoScreens } from "@/components/demo/demo-story";

const DEMO_EVENT = "Espoo Tech Talent Day";
const DEMO_JOBSEEKER = "aino@demo.skillcheck.fi";

/**
 * /demo: the story in seven steps. Each step shows the real platform page (the same components),
 * with only a few rows from the demo database, then a real skill check to try.
 * The platform itself (logins for jobseekers, companies and the City) works on its own, without this page.
 */
export default async function DemoPage({ params }: PageProps<"/[lang]/demo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection(); // live demo data on every visit, never at build time
  const [screens, tryNeeds] = await Promise.all([realPages(lang), demoTryNeeds()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DemoStory lang={lang} event={screens.event} screens={screens.pages} tryNeeds={tryNeeds} />
    </div>
  );
}

/** The platform pages the story walks through, built from the demo database: the event, Aino's booking, her check, the decision. */
async function realPages(lang: string): Promise<{ event: { title: string; startsAt: string; companies: number } | null; pages: DemoScreens }> {
  const event = await db.query.events.findFirst({ where: eq(events.title, DEMO_EVENT) });
  const [check] = await db
    .select({ id: skillChecks.id, needId: skillChecks.needId, turns: skillChecks.turns, candidateId: skillChecks.candidateId })
    .from(skillChecks)
    .innerJoin(user, eq(user.id, skillChecks.candidateId))
    .where(and(eq(user.email, DEMO_JOBSEEKER), isNotNull(skillChecks.finishedAt)))
    .orderBy(desc(skillChecks.finishedAt))
    .limit(1);
  const [apps, confirmed, need, [ev], slots, decisions, [meeting]] = await Promise.all([
    event ? eventApplications(event.id) : Promise.resolve([]),
    event ? db.select({ id: eventCompanies.id }).from(eventCompanies).where(and(eq(eventCompanies.eventId, event.id), isNotNull(eventCompanies.confirmedAt))) : Promise.resolve([]),
    check ? loadNeed(check.needId) : Promise.resolve(null),
    check ? db.select().from(evaluations).where(eq(evaluations.checkId, check.id)) : Promise.resolve([]),
    freeTestSlots({ days: 2 }),
    auditLog(),
    check
      ? db
          .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name, company: companies.name })
          .from(bookings)
          .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
          .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
          .innerJoin(companies, eq(bookings.companyId, companies.id))
          .where(eq(bookings.checkId, check.id))
      : Promise.resolve([]),
  ]);
  const anchors = (need?.anchors ?? []) as SkillAnchor[];
  const missing = <p className="text-sm text-muted-foreground">The demo data is being prepared.</p>;

  return {
    event: event ? { title: event.title, startsAt: event.startsAt.toISOString(), companies: confirmed.length } : null,
    pages: {
      companies: event ? (
        <BrowserFrame url="skillcheck.fi/en/city" who="City of Espoo">
          <PageTitle kicker="City of Espoo" title={event.title} />
          <EventCompanies event={event} applications={apps.slice(0, 5)} />
        </BrowserFrame>
      ) : missing,
      book: need ? (
        <BrowserFrame url="skillcheck.fi/en/candidate/book" who="Aino, jobseeker">
          <PageTitle title="Book your EXAM room time" />
          <BookingForm lang={lang} needs={[{ id: need.id, title: need.title, company: need.company, checkMode: need.checkMode }]} slots={slots.slice(0, 3)} initialNeeds={[need.id]} />
        </BrowserFrame>
      ) : missing,
      check: check && need ? (
        <BrowserFrame url="skillcheck.fi/en/candidate/checks" who="EXAM room computer">
          <PageTitle kicker={need.company} title={need.title}>Answer by voice or text. The interview ends when the panel has heard enough.</PageTitle>
          <CheckRunner demo checkId={check.id} lang="en" initialTurns={(check.turns as { question: string; said?: string; seen: string }[]).slice(0, 2)} pendingQuestion={null} evaluation={null} />
        </BrowserFrame>
      ) : missing,
      result: ev && need ? (
        <BrowserFrame url="skillcheck.fi/en/candidate/checks" who="Aino, jobseeker">
          <PageTitle kicker={need.company} title={need.title}>Ready for companies</PageTitle>
          <EvaluationView e={ev as unknown as EvaluationData} audience="candidate" anchors={anchors} />
        </BrowserFrame>
      ) : missing,
      decide: check && need ? (
        <div className="space-y-4">
          <BrowserFrame url="skillcheck.fi/en/company/candidates" who={need.company} height={260}>
            <PageTitle kicker={need.title} title={aliasFor(check.candidateId)}>
              Skill check in EN, taken at a City of Espoo session. Personal details were removed before AI read the answers.
              {meeting && (
                <p className="mt-3 text-base font-medium text-primary">
                  Accepted. Meeting at the event: {fmtTime(meeting.startsAt)}, {meeting.room}.
                </p>
              )}
            </PageTitle>
          </BrowserFrame>
          <BrowserFrame url="skillcheck.fi/en/city/audit" who="City of Espoo" height={300}>
            <PageTitle title="Audit log">Every human decision and every access to personal data. The database refuses changes and deletions.</PageTitle>
            <DecisionLog rows={decisions.slice(0, 4)} />
          </BrowserFrame>
        </div>
      ) : missing,
    },
  };
}
