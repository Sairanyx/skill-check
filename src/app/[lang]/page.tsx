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
      {/* Hero: our message on Finnish blue, the steps on deep navy (the booth layout on the simple branch) */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[46%] bg-navy md:block" style={{ clipPath: "path('M60 0 C 10 120, 70 220, 20 330 C -10 400, 40 460, 30 600 L 2000 600 L 2000 0 Z')" }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_0.85fr] md:py-20">
          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-tint">{t.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-4xl tracking-tight md:text-5xl">{t.title}</h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">{t.subtitle}</p>
            <Link href={`/${lang}/demo`} className="mt-10 inline-flex h-12 items-center rounded-lg border-2 border-background bg-background px-7 font-heading text-base font-bold text-primary transition-colors hover:bg-transparent hover:text-primary-foreground">
              {t.demoCta} →
            </Link>
          </div>
          <ol className="space-y-6 self-center md:pl-16">
            {t.steps.map((step, i) => (
              <li key={step.title} className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-tint font-heading text-lg font-bold text-tint">{i + 1}</span>
                <span className="font-heading text-lg font-bold">{step.title}</span>
              </li>
            ))}
          </ol>
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
