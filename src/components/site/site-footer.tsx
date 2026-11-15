import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Footer in the espoo.fi pattern: brand on the left, link columns, a thin line, then the credit. Our colours, our words. */
export function SiteFooter({ lang, dict }: { lang: string; dict: Dictionary }) {
  const roles = ["candidate", "company", "city"] as const;
  return (
    <footer className="bg-navy text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8">
        <div className="grid gap-8 border-b border-primary-foreground/25 pb-8 sm:grid-cols-[2fr_1fr_1fr_1.4fr]">
          <div>
            <Link href={`/${lang}`} aria-label="SkillCheck home" className="inline-flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
              {/* Same logo as the header, inverted for the blue footer */}
              <svg viewBox="0 0 32 32" fill="none" aria-hidden className="size-8">
                <path d="M7 3h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H15.5L9 30v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="#fff" />
                <path d="M10 14.5l4.2 4.2L22.5 10.5" stroke="var(--primary)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SkillCheck
            </Link>
            <p className="mt-2 max-w-sm text-sm text-primary-foreground/85">{dict.landing.title}</p>
          </div>
          <div>
            <p className="font-heading font-bold">Demo</p>
            <Link href={`/${lang}/demo`} className="mt-3 block text-sm underline underline-offset-4 hover:no-underline">{dict.landing.demoCta}</Link>
          </div>
          <div>
            <p className="font-heading font-bold">{dict.nav.login}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {roles.map((r) => (
                <li key={r}>
                  <Link href={`/${lang}/login?as=${r}`} className="underline underline-offset-4 hover:no-underline">{dict.landing.roles[r].title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-heading font-bold">AI</p>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/85">
              <li>Gemini 4 Hydrogen, Argon, Carbon</li>
              <li>Gemma 4 26B, Verda, Finland</li>
              <li>Whisper large-v3-turbo, Verda, Finland</li>
            </ul>
          </div>
        </div>
        <p className="pt-6 text-sm text-primary-foreground/85">{dict.footer.made}</p>
      </div>
    </footer>
  );
}
