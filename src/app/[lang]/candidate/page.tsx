import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { myAppointments, MAX_RESCHEDULES, RESCHEDULE_DEADLINE_MS } from "@/lib/services/testing";
import { myChecks } from "@/lib/services/checks";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle, Section, Empty, statusLabel, fmtTime } from "@/components/app/ui";
import { CancelAppointment } from "@/components/app/candidate-actions";

/** Can still be changed: more than 2 hours before the start. */
const changeable = (startsAt: Date) => new Date(startsAt).getTime() - Date.now() > RESCHEDULE_DEADLINE_MS;

export default async function CandidatePage({ params }: PageProps<"/[lang]/candidate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const [appts, checks] = await Promise.all([myAppointments(me), myChecks(me)]);
  const upcoming = appts.filter((a) => a.status === "booked" || a.status === "in_progress");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle kicker="City of Espoo" title="Skill checks">
        A short conversation about real problems from the companies you want to meet, on a City computer in a testing room.
      </PageTitle>

      <Section title="Your testing time" action={!upcoming.length ? <Link href={`/${lang}/candidate/book`} className={buttonVariants({ size: "sm" })}>Book a time</Link> : undefined}>
        {upcoming.length ? (
          <ul className="divide-y border-y">
            {upcoming.map((a) => {
              const canChange = a.status === "booked" && changeable(a.startsAt);
              return (
                <li key={a.id} className="space-y-2 py-4 text-sm">
                  <p className="text-base"><strong>{fmtTime(a.startsAt)}</strong> · {a.venue}, {a.room}, {a.workstation}</p>
                  <p className="text-muted-foreground">{a.needs.map((n) => `${n.company}: ${n.title}`).join(" · ")}</p>
                  <div className="flex items-center gap-4">
                    {canChange && a.rescheduleCount < MAX_RESCHEDULES && (
                      <Link href={`/${lang}/candidate/book?reschedule=${a.id}`} className="text-primary hover:underline">Change time</Link>
                    )}
                    {a.status === "booked" && <CancelAppointment id={a.id} />}
                    {!canChange && a.status === "booked" && <span className="text-muted-foreground">Go to the testing room and log in on {a.workstation}.</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No testing time booked.</Empty>
        )}
      </Section>

      <Section title="Your results" action={<span className="flex gap-4 text-sm"><Link href={`/${lang}/candidate/card`} className="text-primary hover:underline">Event card</Link><Link href={`/${lang}/candidate/privacy`} className="text-primary hover:underline">Your data</Link></span>}>
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
