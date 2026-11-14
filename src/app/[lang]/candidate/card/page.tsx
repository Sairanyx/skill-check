import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { myStamps } from "@/lib/services/checks";
import { PageTitle } from "@/components/app/ui";
import { ConsentToggle } from "@/components/app/consent-toggle";

/** The card printed for the event. Only stamps from companies whose person accepted the result. */
export default async function CardPage({ params }: PageProps<"/[lang]/candidate/card">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const stamps = await myStamps(me);
  const consent = stamps.length > 0 && stamps.every((s) => s.showOnCard);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm text-muted-foreground hover:text-foreground print:hidden">← Skill checks</Link>
      <div className="mt-6 print:hidden">
        <PageTitle title="Event card">Print it or show it at the door. Stamps appear when a company has accepted your skill check.</PageTitle>
        {stamps.length > 0 && <ConsentToggle path="/me/card" field="show" initial={consent} label="Show my stamps on the card" />}
      </div>

      <div className="mt-8 max-w-md rounded-2xl border-2 border-primary p-8">
        <p className="text-sm font-medium text-primary">City of Espoo · Espoo Tech Talent Day</p>
        <p className="mt-4 text-3xl font-semibold">{me.name}</p>
        {consent && (
          <ul className="mt-6 space-y-2">
            {stamps.map((s) => (
              <li key={s.checkId} className="flex items-center gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">✓</span>
                <span>Skill check accepted by <strong>{s.company}</strong></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
