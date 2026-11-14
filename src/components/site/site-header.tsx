import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/lib/session";
import { signOut } from "@/app/actions/auth";
import { LanguageSwitcher } from "./language-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export async function SiteHeader({ lang, nav }: { lang: Locale; nav: Dictionary["nav"] }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href={`/${lang}`} className="font-semibold tracking-tight text-primary">
          Skill Check
        </Link>
        <div className="ml-auto flex items-center gap-6 text-sm">
          <Suspense fallback={null}>
            <Account lang={lang} />
          </Suspense>
          <Suspense fallback={null}>
            <LanguageSwitcher lang={lang} label={nav.language} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function Account({ lang }: { lang: Locale }) {
  const u = await currentUser();
  if (!u) return <Link href={`/${lang}/login`} className="text-muted-foreground hover:text-foreground">Log in</Link>;
  return (
    <form action={signOut.bind(null, lang)} className="flex items-center gap-4">
      <Link href={`/${lang}/${u.role}`} className="text-muted-foreground hover:text-foreground">{u.name}</Link>
      <button className="text-muted-foreground hover:text-foreground">Log out</button>
    </form>
  );
}
