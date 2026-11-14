import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/lib/session";
import { signOut } from "@/app/actions/auth";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export async function SiteHeader({ lang, nav }: { lang: Locale; nav: Dictionary["nav"] }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-20 max-w-6xl items-center px-4">
        <Link href={`/${lang}`} aria-label="SkillCheck home">
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-6 text-[15px]">
          <Suspense fallback={null}>
            <Account lang={lang} nav={nav} />
          </Suspense>
          <Suspense fallback={null}>
            <LanguageSwitcher lang={lang} label={nav.language} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function Account({ lang, nav }: { lang: Locale; nav: Dictionary["nav"] }) {
  const u = await currentUser();
  if (!u) return <Link href={`/${lang}/login`} className="font-semibold text-primary hover:underline">{nav.login}</Link>;
  return (
    <form action={signOut.bind(null, lang)} className="flex items-center gap-4">
      <Link href={`/${lang}/${u.role}`} className="hidden font-semibold text-primary hover:underline sm:inline">{u.name}</Link>
      <button className="whitespace-nowrap font-semibold text-primary hover:underline">{nav.logout}</button>
    </form>
  );
}
