import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { auditTrail } from "@/lib/services/audit";
import { PageTitle, Section, Empty, fmtTime } from "@/components/app/ui";
import { DeleteAccount } from "@/components/app/delete-account";

const ACTION: Record<string, string> = {
  "check.started": "You started a skill check",
  "evaluation.created": "AI summarised your answers (pseudonymised)",
  "check.viewed": "A reviewer opened your answers",
  "candidates.listed": "A company viewed its candidate list",
  "decision.created": "A person made a decision",
  "booking.created": "You booked a meeting",
  "session.booked": "You booked a session",
  "session.checked_in": "You checked in at the venue",
  "session.checkin_failed": "Wrong room code entered",
  "data.exported": "You downloaded your data",
  "proof.declared": "You added a proof",
  "proof.removed": "You removed a proof",
  "proof.verified": "City staff verified a proof",
  "proof.rejected": "City staff did not accept a proof",
  "proofs.listed": "City staff opened proofs to check",
};

export default async function PrivacyPage({ params }: PageProps<"/[lang]/candidate/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const trail = await auditTrail({ subjectId: me.id });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm font-medium text-primary hover:underline">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle title="Your data">
          The City of Espoo is the controller of your data. It is stored in Finland and used only for recruitment event matching.
        </PageTitle>
      </div>

      <Section title="Who used your data" action={<a href="/api/v1/me/export" download="my-skill-check-data.json" className="text-sm text-primary hover:underline">Download all my data</a>}>
        {trail.length ? (
          <ul className="divide-y border-y text-sm">
            {trail.map((e) => (
              <li key={e.id} className="flex justify-between gap-6 py-3">
                <span>{ACTION[e.action] ?? e.action}</span>
                <span className="shrink-0 text-muted-foreground">{e.actorRole} · {fmtTime(e.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing yet.</Empty>
        )}
      </Section>

      <Section title="Delete your account">
        <DeleteAccount lang={lang} />
      </Section>
    </div>
  );
}
