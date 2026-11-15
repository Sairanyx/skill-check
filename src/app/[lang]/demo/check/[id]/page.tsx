import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { currentUser } from "@/lib/session";
import { getCheck } from "@/lib/services/checks";
import { loadNeed } from "@/lib/services/needs";
import { CheckRunner } from "@/components/app/check-runner";
import type { EvaluationData, SkillAnchor } from "@/components/app/evaluation-view";
import { PageTitle } from "@/components/app/ui";
import { EndDemoVisit } from "@/components/demo/end-demo-visit";

/** DEMO: the visitor's own skill check, in the demo EXAM room. Same conversation, privacy guard and panel as the platform. */
export default async function DemoCheckPage({ params }: PageProps<"/[lang]/demo/check/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await currentUser();
  if (!me || me.role !== "candidate") redirect(`/${lang}/demo`);
  const check = await getCheck({ id: me.id, name: me.name, email: me.email, role: "candidate" }, id).catch(() => null);
  if (!check) notFound();
  const need = await loadNeed(check.need.id).catch(() => null);
  const running = check.status === "in_progress";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/demo`} className="text-sm font-medium text-primary hover:underline">← Demo</Link>
      <div className="mt-6">
        <PageTitle kicker={`${check.need.company} · Demo EXAM room`} title={check.need.title}>
          {running
            ? "Answer in your own words, by voice or text. The AI panel asks until it has heard enough, usually 3 to 6 questions. Under each answer you see exactly what the AI received."
            : "Your feedback per skill, with your own words as evidence. In the platform, the company and the City see this too, under an alias, and people decide."}
        </PageTitle>
      </div>
      <CheckRunner
        demo
        anchors={(need?.anchors ?? []) as SkillAnchor[]}
        checkId={id}
        lang={check.language}
        initialTurns={check.turns as { question: string; said?: string; seen: string }[]}
        pendingQuestion={check.pendingQuestion ?? null}
        evaluation={check.evaluation as EvaluationData | null}
      />
      <EndDemoVisit lang={lang} />
    </div>
  );
}
