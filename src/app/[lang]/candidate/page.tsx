import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { listSessions, mySessions } from "@/lib/services/sessions";
import { myChecks } from "@/lib/services/checks";
import { listNeeds } from "@/lib/services/needs";
import { PageTitle, Section, Empty, statusLabel, fmtTime } from "@/components/app/ui";
import { BookSessionButton, CheckInForm, StartCheckButton } from "@/components/app/candidate-actions";

export default async function CandidatePage({ params }: PageProps<"/[lang]/candidate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const [booked, all, checks, needs] = await Promise.all([mySessions(me), listSessions(), myChecks(me), listNeeds()]);

  const active = booked.find((s) => s.openedAt && !s.closedAt);
  const upcoming = booked.filter((s) => !s.closedAt);
  const bookable = all.filter((s) => !s.closedAt && !booked.some((b) => b.id === s.id) && s.booked < s.capacity);
  const done = new Set(checks.map((c) => c.needTitle));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle kicker="City of Espoo" title="Skill checks">
        Skill checks take place in a session run by the City of Espoo, at the venue or online room you book.
      </PageTitle>

      {active && (
        <Section title={`Now: ${active.venue}, ${active.room}`}>
          {!active.checkedInAt ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">Enter the code shown in the room to unlock your skill checks.</p>
              <CheckInForm sessionId={active.id} />
            </>
          ) : (
            <ul className="divide-y border-y">
              {needs.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-6 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{n.company}</p>
                    <p className="font-medium">{n.title}</p>
                  </div>
                  {done.has(n.title) ? <span className="text-sm text-muted-foreground">Done</span> : <StartCheckButton needId={n.id} sessionId={active.id} lang={lang} />}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Your sessions">
        {upcoming.length ? (
          <ul className="space-y-2 text-sm">
            {upcoming.map((s) => (
              <li key={s.id} className="flex justify-between gap-4">
                <span>{s.venue}, {s.room}</span>
                <span className="text-muted-foreground">{fmtTime(s.startsAt)}{s.openedAt && !s.closedAt ? " · open now" : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No session booked yet.</Empty>
        )}
        {bookable.length > 0 && (
          <ul className="mt-6 divide-y border-y">
            {bookable.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-6 py-4 text-sm">
                <div>
                  <p className="font-medium">{s.venue}</p>
                  <p className="text-muted-foreground">{s.room} · {fmtTime(s.startsAt)} · {s.capacity - s.booked} seats left</p>
                </div>
                <BookSessionButton sessionId={s.id} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Your results" action={<Link href={`/${lang}/candidate/privacy`} className="text-sm text-primary hover:underline">Your data</Link>}>
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
          <Empty>Your results appear here after a skill check.</Empty>
        )}
      </Section>
    </div>
  );
}
