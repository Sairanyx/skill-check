import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { cityStats } from "@/lib/services/decisions";
import { reviewQueue } from "@/lib/services/checks";
import { testingOverview } from "@/lib/services/testing";
import { PageTitle, Section, Empty, fmtTime } from "@/components/app/ui";
import { EnrollHere } from "@/components/app/city-actions";

export default async function CityPage({ params }: PageProps<"/[lang]/city">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "city");
  const [stats, queue, stations] = await Promise.all([cityStats(), reviewQueue(), testingOverview()]);
  const decided = stats.decisions.aiFollowed + stats.decisions.aiOverridden;
  const tiles = [
    { label: "Skill checks", value: stats.checks.total },
    { label: "Waiting for review", value: stats.checks.inReview },
    { label: "Human decisions", value: stats.decisions.total },
    { label: "Meetings booked", value: stats.meetingsBooked },
    { label: "Decisions matching AI", value: decided ? `${Math.round((stats.decisions.aiFollowed / decided) * 100)}%` : "–" },
    { label: "Fairness flags", value: stats.fairnessFlags },
  ];
  const venues = [...new Set(stations.map((s) => `${s.venue} · ${s.room}`))];

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
          <Empty>Nothing to review. Low-confidence or flagged results appear here before any company sees them.</Empty>
        )}
      </Section>

      <Section title="Testing rooms">
        {venues.map((v) => (
          <div key={v} className="mb-6">
            <p className="mb-2 text-sm font-medium">{v}</p>
            <ul className="divide-y border-y text-sm">
              {stations.filter((s) => `${s.venue} · ${s.room}` === v).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-6 py-3">
                  <span>
                    {s.label}
                    <span className="ml-3 text-muted-foreground">
                      {s.enrolledAt ? "set up" : "not set up"}
                      {s.bookings.length ? ` · next booking ${fmtTime(s.bookings[0].startsAt)}` : ""}
                    </span>
                  </span>
                  <EnrollHere workstationId={s.id} label={`${s.venue}, ${s.room}, ${s.label}`} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    </div>
  );
}
