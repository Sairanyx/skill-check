import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { cityStats } from "@/lib/services/decisions";
import { reviewQueue, cityMatchingList } from "@/lib/services/checks";
import { eventApplications } from "@/lib/services/company";
import { db, events as eventsTable } from "@/db";
import { EventPolicyToggle, ApproveCompany } from "@/components/app/event-actions";
import { testingOverview } from "@/lib/services/testing";
import { PageTitle, Section, Empty, fmtTime, eventMode } from "@/components/app/ui";
import { EnrollHere } from "@/components/app/city-actions";
import { VerifyProof } from "@/components/app/proof-actions";
import { proofsToVerify } from "@/lib/services/proofs";

export default async function CityPage({ params }: PageProps<"/[lang]/city">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "city");
  const [stats, queue, stations, matching, events, proofQueue] = await Promise.all([cityStats(), reviewQueue(), testingOverview(), cityMatchingList(), db.select().from(eventsTable).orderBy(eventsTable.startsAt), proofsToVerify(me)]);
  const applications = await Promise.all(events.map((e) => eventApplications(e.id)));
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

      <Section title="Events">
        {events.map((e, i) => (
          <div key={e.id} className="mb-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
              <p className="font-medium">{e.title} <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal">{eventMode(e.mode)}</span> <span className="font-normal text-muted-foreground">· {fmtTime(e.startsAt)}</span></p>
              <EventPolicyToggle eventId={e.id} policy={e.checkPolicy} />
            </div>
            <ul className="divide-y border-y text-sm">
              {applications[i].map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-2">
                  <span>{a.company} <span className="text-muted-foreground">· {a.checkMode === "off" ? "no skill check needed" : `skill check ${a.checkMode}`}</span></span>
                  {a.confirmedAt ? <span className="text-primary">Confirmed</span> : a.approvedAt ? <span className="text-muted-foreground">Approved, waiting for confirmation</span> : <ApproveCompany eventId={e.id} appId={a.id} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Matching">
        {matching.length ? (
          <ul className="divide-y border-y text-sm">
            {matching.map((m) => (
              <li key={m.checkId}>
                <Link href={`/${lang}/city/review/${m.checkId}`} className="flex justify-between gap-6 py-3 hover:text-primary">
                  <span>{m.alias} · {m.company} · {m.needTitle}</span>
                  <span className="text-muted-foreground">{m.match}/10 · {m.state}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Results appear here after skill checks. Accept them for the company, or leave it to the company.</Empty>
        )}
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
          <Empty>Nothing to review. Low-confidence or flagged results appear here before any company sees them.</Empty>
        )}
      </Section>

      <Section title="Proofs to check at the desk">
        {proofQueue.length ? (
          <ul className="divide-y border-y text-sm">
            {proofQueue.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <span>
                  <strong>{p.candidate}</strong> · {p.label}
                  {p.level ? `, ${p.level}` : ""}
                  <span className="block text-xs text-muted-foreground">{p.howToCheck}</span>
                </span>
                <VerifyProof id={p.id} howToCheck={p.howToCheck ?? "Original seen"} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing to check.</Empty>
        )}
      </Section>

      <Section title="EXAM rooms">
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
