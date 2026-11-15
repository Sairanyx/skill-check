import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { myStamps } from "@/lib/services/checks";
import { PageTitle } from "@/components/app/ui";
import { ConsentToggle } from "@/components/app/consent-toggle";
import { Logo } from "@/components/site/logo";

/** The card printed for the event. Only stamps from companies whose person accepted the result. */
export default async function CardPage({ params }: PageProps<"/[lang]/candidate/card">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const stamps = await myStamps(me);
  const consent = stamps.length > 0 && stamps.every((s) => s.showOnCard);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm text-muted-foreground hover:text-foreground print:hidden">← Skill checks</Link>
      <div className="mt-6 print:hidden">
        <PageTitle title="Lanyard card">Printed for your badge at the event. A stamp appears when the company or the City of Espoo has accepted your skill check for that company.</PageTitle>
        {stamps.length > 0 && <ConsentToggle path="/me/card" field="show" initial={consent} label="Show my stamps on the card" />}
      </div>

      <div className="mt-8 max-w-md rounded-2xl border-2 border-primary p-8">
        <Logo size="sm" className="mb-4" />
        <p className="text-sm font-medium text-primary">City of Espoo · Espoo Tech Talent Day</p>
        <p className="mt-1 text-xs text-muted-foreground">Open event: talk to any company</p>
        <p className="mt-4 text-3xl font-semibold">{me.name}</p>
        {consent && (
          <ul className="mt-6 space-y-2">
            {stamps.map((s) => (
              <li key={s.checkId} className="flex items-center gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden><path d="M5 12l5 5L20 7" /></svg></span>
                <span>
                  Skill check for <strong>{s.company}</strong>
                  <span className="block text-xs text-muted-foreground">
                    accepted by {[s.byCompany && s.company, s.byCity && "the City of Espoo"].filter(Boolean).join(" and ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
