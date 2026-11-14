"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

// Plain text toggles: EN · FI · SV
export function LanguageSwitcher({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const rest = pathname.replace(/^\/(en|fi|sv)(?=\/|$)/, "");

  return (
    <nav aria-label={label} className="flex gap-3 text-sm">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => router.push(`/${l}${rest}`)}
          aria-current={l === lang ? "true" : undefined}
          className={l === lang ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
