import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { companyCandidates } from "@/lib/services/checks";
import { companyEvents, latestDecisions, myMeetings, myNeeds } from "@/lib/services/company";
import { CompanyEventRow } from "@/components/app/event-actions";
import { PageTitle, Section, Empty, fmtTime, eventMode } from "@/components/app/ui";

const DECISION: Record<string, string> = { invite: "Accepted", not_now: "Not this time", needs_review: "Sent to City" };

const canConfirm = (deadline: Date) => Date.now() < new Date(deadline).getTime();

export default async function CompanyPage({ params }: PageProps<"/[lang]/company">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "company");
  const [needs, candidates, meetings, events] = await Promise.all([myNeeds(me), companyCandidates(me), myMeetings(me), companyEvents(me)]);
  const decided = await latestDecisions(candidates.map((c) => c.checkId));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle kicker={me.name} title="Candidates">
        People who took a skill check for your needs, with the AI feedback on each. It shows who has the basics for the job. You decide whom to meet. Names and contact details stay with the City of Espoo. Candidates can choose to share their contact with you.
      </PageTitle>

      <Section title="City of Espoo events">
        <ul className="divide-y border-y text-sm">
          {events.map((e) => (
            <li key={e.eventId} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{e.title} <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal">{eventMode(e.mode)}</span></p>
                <p className="text-muted-foreground">{fmtTime(e.startsAt)} · {e.location} · confirm by {fmtTime(e.deadline)}{e.checkPolicy === "none" ? " · open event, no skill checks" : ""}</p>
              </div>
              <CompanyEventRow eventId={e.eventId} status={e.status} checkMode={e.checkMode} canConfirm={canConfirm(e.deadline)} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Ready to review (optional, the City reviews too)">
        {candidates.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b"><th className="py-2 font-normal">Candidate</th><th className="hidden font-normal sm:table-cell">Need</th><th className="font-normal">Match</th><th className="hidden font-normal sm:table-cell">Level</th><th className="font-normal">Confidence</th><th className="font-normal">Decision</th></tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.checkId} className="border-b hover:bg-muted/50">
                  <td className="py-3"><Link href={`/${lang}/company/candidates/${c.checkId}`} className="font-medium text-primary hover:underline">{c.alias}</Link></td>
                  <td className="hidden sm:table-cell">{c.needTitle}</td>
                  <td className="font-semibold">{c.match}/10</td>
                  <td className="hidden capitalize sm:table-cell">{c.level}</td>
                  <td>{Math.round(c.confidence * 100)}%</td>
                  <td className="text-muted-foreground">{DECISION[decided.get(c.checkId) ?? ""] ?? "Open"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No evaluated candidates yet.</Empty>
        )}
      </Section>

      <Section title="Meetings at the event">
        {meetings.length ? (
          <ul className="divide-y border-y text-sm">
            {meetings.map((m) => (
              <li key={m.checkId} className="flex justify-between gap-6 py-3">
                <span><strong>{fmtTime(m.startsAt)}</strong>, {m.room} · {m.need}</span>
                <span className="text-muted-foreground">{m.alias}{m.contact ? ` · ${m.contact}` : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No meetings booked yet.</Empty>
        )}
      </Section>

      <Section title="Your needs" action={<Link href={`/${lang}/company/needs/new`} className="text-sm text-primary hover:underline">Add a need</Link>}>
        <ul className="divide-y border-y text-sm">
          {needs.map((n) => (
            <li key={n.id} className="py-3">
              <div className="flex justify-between gap-6">
                <span><span className="font-medium">{n.title}</span> <span className="text-muted-foreground">· {n.skills.join(", ")}</span></span>
                <span className="flex shrink-0 gap-4 text-muted-foreground">{n.ready} ready <Link href={`/${lang}/company/needs/${n.id}`} className="text-primary hover:underline">Edit</Link></span>
              </div>
              {!!n.escoSkills?.length && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ESCO:{" "}
                  {n.escoSkills.map((e, i) => (
                    <span key={e.uri}>
                      {i > 0 && ", "}
                      <a href={e.uri} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{(lang === "fi" && e.label.fi) || (lang === "sv" && e.label.sv) || e.label.en}</a>
                    </span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
