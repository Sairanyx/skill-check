import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getCheck } from "@/lib/services/checks";
import { bookingForCheck } from "@/lib/services/company";
import { EvaluationView, type EvaluationData } from "@/components/app/evaluation-view";
import { Transcript } from "@/components/app/transcript";
import { DecisionPanel } from "@/components/app/decision-panel";
import { PageTitle, Section, fmtTime } from "@/components/app/ui";

export default async function CandidateEvidence({ params }: PageProps<"/[lang]/company/candidates/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "company");
  const check = await getCheck(me, id).catch(() => null);
  if (!check || !check.evaluation) notFound();
  const booking = await bookingForCheck(id);
  const mine = check.decisions.filter((d) => d.role === "company");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/company`} className="text-sm text-muted-foreground hover:text-foreground">← Candidates</Link>
      <div className="mt-6">
        <PageTitle kicker={check.need.title} title={check.candidate.alias}>
          Skill check in {check.language.toUpperCase()}, taken at a City of Espoo session. Personal details were removed before AI read the answers.
        </PageTitle>
      </div>

      <EvaluationView e={check.evaluation as unknown as EvaluationData} audience="reviewer" />

      <Section title="Your decision">
        {booking ? (
          <p className="text-sm">Meeting booked: <strong>{fmtTime(booking.startsAt)}</strong>, {booking.room}. Contact: {booking.email}</p>
        ) : (
          <DecisionPanel
            checkId={id}
            options={[
              { value: "invite", label: "Invite to meet", primary: true },
              { value: "not_now", label: "Not now" },
              { value: "needs_review", label: "Ask the City to review" },
            ]}
          />
        )}
        {mine.length > 0 && (
          <ul className="mt-6 space-y-1 text-xs text-muted-foreground">
            {mine.map((d) => (
              <li key={d.id}>{fmtTime(d.createdAt)} · {d.decision}{d.note ? ` · “${d.note}”` : ""}{d.aiFollowed === false ? " · differed from AI" : ""}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Full conversation (pseudonymised)">
        <Transcript turns={check.turns as { question: string; seen: string }[]} />
      </Section>
    </div>
  );
}
