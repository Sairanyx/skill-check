import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getCheck } from "@/lib/services/checks";
import { EvaluationView, type EvaluationData } from "@/components/app/evaluation-view";
import { Transcript } from "@/components/app/transcript";
import { DecisionPanel } from "@/components/app/decision-panel";
import { PageTitle, Section } from "@/components/app/ui";
import { IdentityReveal } from "@/components/app/identity-reveal";

export default async function ReviewPage({ params }: PageProps<"/[lang]/city/review/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "city");
  const check = await getCheck(me, id).catch(() => null);
  if (!check || !check.evaluation) notFound();
  const flagged = check.status === "needs_review";
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/city`} className="text-sm text-muted-foreground hover:text-foreground">← Overview</Link>
      <div className="mt-6">
        <PageTitle kicker={`${check.need.company} · ${check.need.title}`} title={flagged ? "Human review" : check.candidate.alias}>
          {flagged
            ? "The AI was unsure or the fairness check raised a flag. Read the conversation and decide whether this result is released."
            : "Decide whether this person is accepted for the company. The company can also decide; its own decision applies to itself."}
        </PageTitle>
      </div>
      <EvaluationView e={check.evaluation as unknown as EvaluationData} audience="reviewer" />
      <Section title="Your decision">
        {flagged ? (
          <DecisionPanel checkId={id} options={[{ value: "approve", label: "Release result", primary: true }, { value: "reject", label: "Withdraw result" }]} />
        ) : (
          <DecisionPanel checkId={id} options={[{ value: "invite", label: `Accept for ${check.need.company}`, primary: true }, { value: "not_now", label: "Not this time" }]} />
        )}
      </Section>
      <Section title="Identity">
        <p className="mb-3 text-sm text-muted-foreground">Reviews are done without knowing who the person is. Only open the identity if you need to, the reason is recorded.</p>
        <IdentityReveal checkId={id} />
      </Section>
      <Section title="Full conversation (pseudonymised)">
        <Transcript turns={check.turns as { question: string; seen: string }[]} />
      </Section>
    </div>
  );
}
