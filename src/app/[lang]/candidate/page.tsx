import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getDictionary } from "@/i18n/get-dictionary";
import { DEMO_NEEDS } from "@/lib/demo-data";

export default async function CandidatePage({ params }: PageProps<"/[lang]/candidate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "candidate");
  const t = (await getDictionary(lang)).dashboard.candidate;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-medium text-primary">Espoo Tech Talent Day</p>
      <h1 className="mt-2 text-3xl font-semibold">{t.title}</h1>
      <ul className="mt-10 divide-y border-y">
        {DEMO_NEEDS.map((need) => (
          <li key={need.id}>
            <Link href={`/${lang}/candidate/check/${need.id}`} className="group flex items-center justify-between gap-6 py-6">
              <div>
                <p className="text-sm text-muted-foreground">{need.company}</p>
                <p className="mt-1 font-medium group-hover:text-primary">{need.title}</p>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{need.summary}</p>
              </div>
              <span className="text-primary" aria-hidden>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
