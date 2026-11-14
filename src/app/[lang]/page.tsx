import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function Landing({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).landing;
  const roles = ["candidate", "company", "city"] as const;

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-20 md:py-28">
        <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">{t.title}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{t.subtitle}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={`/${lang}/tour`} className={`${buttonVariants({ size: "lg" })} h-11 px-6 text-base`}>
            {t.demoCta}
          </Link>
        </div>
      </section>

      <section className="border-t py-16">
        <h2 className="text-xl font-semibold">{t.doorsTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <div key={role} className="flex flex-col rounded-lg border p-6">
              <h3 className="font-semibold text-primary">{t.roles[role].title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{role === "city" ? `${t.roles[role].text} ${t.staffNote}` : t.roles[role].text}</p>
              <div className="mt-5 flex gap-3">
                <Link href={`/${lang}/login?as=${role}`} className={buttonVariants({ variant: role === "city" ? "outline" : "default" })}>
                  {role === "city" ? t.staffLogin : t.login}
                </Link>
                {role !== "city" && (
                  <Link href={`/${lang}/signup?as=${role}`} className={buttonVariants({ variant: "outline" })}>
                    {t.signup}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t py-16">
        <h2 className="text-xl font-semibold">{t.howTitle}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-4">
          {t.steps.map((step, i) => (
            <li key={step.title}>
              <span className="text-sm font-semibold text-primary">{i + 1}</span>
              <h3 className="mt-1 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>



      <section className="border-t py-16">
        <h2 className="text-xl font-semibold">{t.privacyTitle}</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {t.privacy.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {p}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
