import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { myAppointments, MAX_RESCHEDULES, RESCHEDULE_DEADLINE_MS } from "@/lib/services/testing";
import { myChecks } from "@/lib/services/checks";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle, Section, Empty, statusLabel, fmtTime, fmtClock, eventMode } from "@/components/app/ui";
import { asc, gt } from "drizzle-orm";
import { db, events } from "@/db";
import { CancelAppointment } from "@/components/app/candidate-actions";
import { ExamRoomStart } from "@/components/app/exam-room-start";

/** Can still be changed: more than 2 hours before the start. */
const changeable = (startsAt: Date) => new Date(startsAt).getTime() - Date.now() > RESCHEDULE_DEADLINE_MS;

const hasPassed = (d: Date) => d.getTime() <= Date.now();
const hasStarted = (d: Date) => d.getTime() - 10 * 60_000 <= Date.now(); // login opens 10 minutes before the slot

export default async function CandidatePage({ params }: PageProps<"/[lang]/candidate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const [appts, checks, upcomingEvents] = await Promise.all([myAppointments(me), myChecks(me), db.select().from(events).where(gt(events.startsAt, new Date())).orderBy(asc(events.startsAt))]);
  // A time that has passed without a check is simply missed: no penalty, the jobseeker can book again.
  const upcoming = appts.filter((a) => (a.status === "booked" || a.status === "in_progress") && !hasPassed(a.endsAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle kicker="City of Espoo" title="Skill checks">
        A short conversation about real problems from the companies you want to meet, on a City computer in an EXAM room, like the ones Finnish universities use for exams.
      </PageTitle>

      <Section title="Recruitment events">
        <p className="mb-4 text-sm text-muted-foreground">Choose an event to see which companies come and what each one asks for.</p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {upcomingEvents.map((e) => (
            <li key={e.id}>
              <Link href={`/${lang}/candidate/events/${e.id}`} className="block h-full rounded-lg border p-4 transition-colors hover:border-primary">
                <span className="rounded-full border px-2 py-0.5 text-xs">{eventMode(e.mode)}</span>
                <span className="mt-2 block font-medium">{e.title}</span>
                <span className="block text-sm text-muted-foreground">{fmtTime(e.startsAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Your testing time" action={!upcoming.length ? <Link href={`/${lang}/candidate/book`} className={buttonVariants({ size: "sm" })}>Book a time</Link> : undefined}>
        {upcoming.length ? (
          <ul className="divide-y border-y">
            {upcoming.map((a) => {
              const canChange = a.status === "booked" && changeable(a.startsAt);
              return (
                <li key={a.id} className="space-y-2 py-4 text-sm">
                  <p className="text-base"><strong>{fmtTime(a.startsAt)} to {fmtClock(a.endsAt)}</strong> · {a.venue}, {a.room}, {a.workstation}</p>
                  <p className="text-muted-foreground">{a.needs.map((n) => `${n.company}: ${n.title}`).join(" · ")}</p>
                  <div className="flex items-center gap-4">
                    {canChange && a.rescheduleCount < MAX_RESCHEDULES && (
                      <Link href={`/${lang}/candidate/book?reschedule=${a.id}`} className="text-primary hover:underline">Change time</Link>
                    )}
                    {a.status === "booked" && !hasPassed(a.startsAt) && <CancelAppointment id={a.id} />}
                    {hasStarted(a.startsAt) ? (
                      <ExamRoomStart appointmentId={a.id} place={`${a.venue}, ${a.room}, ${a.workstation}`} lang={lang} />
                    ) : (
                      !canChange && a.status === "booked" && <span className="text-muted-foreground">Go to the EXAM room and log in on {a.workstation}.</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No testing time booked.</Empty>
        )}
      </Section>

      <Section title="Your results" action={<span className="flex gap-4 text-sm"><Link href={`/${lang}/candidate/card`} className="text-primary hover:underline">Event card</Link><Link href={`/${lang}/candidate/proofs`} className="text-primary hover:underline">Proofs</Link><Link href={`/${lang}/candidate/privacy`} className="text-primary hover:underline">Your data</Link></span>}>
        {checks.length ? (
          <ul className="divide-y border-y">
            {checks.map((c) => (
              <li key={c.id}>
                <Link href={`/${lang}/candidate/checks/${c.id}`} className="flex items-center justify-between gap-6 py-4 hover:text-primary">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.company}</p>
                    <p className="font-medium">{c.needTitle}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{statusLabel(c.status)}{c.match != null ? ` · ${c.match}/10` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Your results appear here after your skill check.</Empty>
        )}
      </Section>
    </div>
  );
}
