import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getCheck } from "@/lib/services/checks";
import { EvaluationView, type EvaluationData } from "@/components/app/evaluation-view";
import { Transcript } from "@/components/app/transcript";
import { DecisionPanel } from "@/components/app/decision-panel";
import { PageTitle, Section } from "@/components/app/ui";

export default async function ReviewPage({ params }: PageProps<"/[lang]/city/review/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "city");
  const check = await getCheck(me, id).catch(() => null);
  if (!check || !check.evaluation) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/city`} className="text-sm text-muted-foreground hover:text-foreground">← Overview</Link>
      <div className="mt-6">
        <PageTitle kicker={`${check.need.company} · ${check.need.title}`} title="Human review">
          The AI was unsure or the fairness check raised a flag. Read the conversation and decide whether the company should see this result.
        </PageTitle>
      </div>
      <EvaluationView e={check.evaluation as unknown as EvaluationData} audience="reviewer" />
      <Section title="Your decision">
        <DecisionPanel checkId={id} options={[{ value: "approve", label: "Release to company", primary: true }, { value: "reject", label: "Withdraw result" }]} />
      </Section>
      <Section title="Full conversation (pseudonymised)">
        <Transcript turns={check.turns as { question: string; seen: string }[]} />
      </Section>
    </div>
  );
}
