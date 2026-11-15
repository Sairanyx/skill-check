import Link from "next/link";
import { PagedRows } from "@/components/app/paged";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { auditTrail } from "@/lib/services/audit";
import { auditLog } from "@/lib/services/decisions";
import { PageTitle, Section, fmtTime } from "@/components/app/ui";
import { DecisionLog } from "@/components/app/decision-log";

export default async function AuditPage({ params }: PageProps<"/[lang]/city/audit">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "city");
  const [access, decisions] = await Promise.all([auditTrail(), auditLog()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/city`} className="text-sm font-medium text-primary hover:underline">← Overview</Link>
      <div className="mt-6">
        <PageTitle title="Audit log">
          Every human decision and every access to personal data. Records are append-only: the database refuses changes and deletions.
        </PageTitle>
      </div>
      <Section title="Human decisions">
        <DecisionLog rows={decisions} />
      </Section>
      <Section title="Access to personal data">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr className="border-b"><th className="py-2 font-normal">Time</th><th className="font-normal">Role</th><th className="font-normal">Action</th><th className="font-normal">Purpose</th></tr></thead>
          <tbody>
            <PagedRows columns={5}>
            {access.map((e) => (
              <tr key={e.id} className="border-b"><td className="py-2">{fmtTime(e.at)}</td><td>{e.actorRole}</td><td className="font-mono text-xs">{e.action}</td><td className="text-muted-foreground">{e.purpose}</td></tr>
            ))}
          </PagedRows>
          </tbody>
        </table>
      </Section>
    </div>
  );
}
