import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { cityStats } from "@/lib/services/decisions";
import { reviewQueue } from "@/lib/services/checks";
import { listSessions } from "@/lib/services/sessions";
import { PageTitle, Section, Empty, fmtTime } from "@/components/app/ui";
import { SessionToggle } from "@/components/app/city-actions";

export default async function CityPage({ params }: PageProps<"/[lang]/city">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "city");
  const [stats, queue, sessions] = await Promise.all([cityStats(), reviewQueue(), listSessions()]);
  const followRate = stats.decisions.total ? Math.round((stats.decisions.aiFollowed / Math.max(1, stats.decisions.aiFollowed + stats.decisions.aiOverridden)) * 100) : 0;

  const tiles = [
    { label: "Skill checks", value: stats.checks.total },
    { label: "Waiting for review", value: stats.checks.inReview },
    { label: "Human decisions", value: stats.decisions.total },
    { label: "Meetings booked", value: stats.meetingsBooked },
    { label: "Decisions matching AI", value: `${followRate}%` },
    { label: "Fairness flags", value: stats.fairnessFlags },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle kicker="City of Espoo" title="Espoo Tech Talent Day" />

      <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label}>
            <p className="text-3xl font-semibold text-primary">{t.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
          </div>
        ))}
      </div>

      <Section title="Skill-check sessions">
        <ul className="divide-y border-y text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-6 py-4">
              <div>
                <p className="font-medium">{s.venue}, {s.room}</p>
                <p className="text-muted-foreground">{fmtTime(s.startsAt)} · {s.booked}/{s.capacity} booked{s.open ? " · open" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.open && <Link href={`/${lang}/city/sessions/${s.id}`} className="text-primary hover:underline">Room screen</Link>}
                <SessionToggle sessionId={s.id} open={s.open} />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Human review queue" action={<Link href={`/${lang}/city/audit`} className="text-sm text-primary hover:underline">Audit log</Link>}>
        {queue.length ? (
          <ul className="divide-y border-y text-sm">
            {queue.map((q) => (
              <li key={q.checkId}>
                <Link href={`/${lang}/city/review/${q.checkId}`} className="flex justify-between gap-6 py-3 hover:text-primary">
                  <span>{q.company} · {q.needTitle}</span>
                  <span className="text-muted-foreground">confidence {Math.round(q.confidence * 100)}%{q.flags.length ? ` · ${q.flags.join(", ")}` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing to review. Low-confidence or flagged checks appear here before any company sees them.</Empty>
        )}
      </Section>
    </div>
  );
}
