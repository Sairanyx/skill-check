import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function Landing({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).landing;
  const roles = ["candidate", "company", "city"] as const;

  return (
    <>
      {/* Hero band, like espoo.fi: Finnish blue with white text */}
      <section className="overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_auto] md:py-24">
          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-tint">{t.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-4xl tracking-tight md:text-6xl">{t.title}</h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">{t.subtitle}</p>
            <Link href={`/${lang}/demo`} className="mt-10 inline-flex h-12 items-center rounded-lg border-2 border-background bg-background px-7 font-heading text-base font-bold text-primary transition-colors hover:bg-transparent hover:text-primary-foreground">
              {t.demoCta} →
            </Link>
          </div>
          <svg viewBox="0 0 32 32" aria-hidden className="hidden size-64 md:block">
            <path d="M7 3h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H15.5L9 30v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="var(--tint)" />
            <path d="M10 14.5l4.2 4.2L22.5 10.5" stroke="var(--primary)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl">{t.doorsTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Link key={role} href={`/${lang}/login?as=${role}`} className="group flex flex-col rounded-lg border-2 border-border p-6 transition-colors hover:border-primary hover:bg-tint/40">
              <h3 className="text-lg font-bold text-primary group-hover:underline">{t.roles[role].title} →</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{role === "city" ? `${t.roles[role].text} ${t.staffNote}` : t.roles[role].text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl">{t.howTitle}</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-4">
            {t.steps.map((step, i) => (
              <li key={step.title}>
                <span className="flex size-9 items-center justify-center rounded-full bg-primary font-heading text-primary-foreground">{i + 1}</span>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl">{t.privacyTitle}</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {t.privacy.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {p}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
