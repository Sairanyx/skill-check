import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { NeedForm } from "@/components/app/need-form";
import { PageTitle } from "@/components/app/ui";

export default async function NewNeed({ params }: PageProps<"/[lang]/company/needs/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "company");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/company`} className="text-sm font-medium text-primary hover:underline">← Candidates</Link>
      <div className="mt-6">
        <PageTitle title="Add a need">Describe the problem you need solved. The skill check questions are built from this.</PageTitle>
      </div>
      <NeedForm lang={lang} />
    </div>
  );
}
