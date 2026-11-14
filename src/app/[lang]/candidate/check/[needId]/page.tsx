import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getNeed } from "@/lib/demo-data";
import { SkillCheck } from "@/components/check/skill-check";

export default async function CheckPage({ params }: PageProps<"/[lang]/candidate/check/[needId]">) {
  const { lang, needId } = await params;
  const need = getNeed(needId);
  if (!hasLocale(lang) || !need) notFound();
  await requireRole(lang, "candidate");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-sm text-muted-foreground">{need.company}</p>
      <h1 className="text-2xl font-semibold">{need.title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{need.summary}</p>
      <SkillCheck needId={need.id} lang={lang} />
    </div>
  );
}
