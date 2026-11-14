import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { auditTrail } from "@/lib/services/audit";
import { auditLog } from "@/lib/services/decisions";
import { PageTitle, Section, fmtTime } from "@/components/app/ui";

export default async function AuditPage({ params }: PageProps<"/[lang]/city/audit">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "city");
  const [access, decisions] = await Promise.all([auditTrail(), auditLog()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/city`} className="text-sm font-medium text-primary hover:underline">← Overview</Link>
      <div className="mt-6">
        <PageTitle title="Audit log">
          Every human decision and every access to personal data. Records are append-only: the database refuses changes and deletions.
        </PageTitle>
      </div>
      <Section title="Human decisions">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr className="border-b"><th className="py-2 font-normal">Time</th><th className="font-normal">Who</th><th className="font-normal">Decision</th><th className="font-normal">Matched AI</th><th className="font-normal">Need</th></tr></thead>
          <tbody>
            {decisions.map((d, i) => (
              <tr key={i} className="border-b"><td className="py-2">{fmtTime(d.at)}</td><td>{d.by} ({d.role})</td><td>{d.decision}</td><td>{d.aiFollowed == null ? "n/a" : d.aiFollowed ? "yes" : "no"}</td><td>{d.company} · {d.need}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Access to personal data">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr className="border-b"><th className="py-2 font-normal">Time</th><th className="font-normal">Role</th><th className="font-normal">Action</th><th className="font-normal">Purpose</th></tr></thead>
          <tbody>
            {access.map((e) => (
              <tr key={e.id} className="border-b"><td className="py-2">{fmtTime(e.at)}</td><td>{e.actorRole}</td><td className="font-mono text-xs">{e.action}</td><td className="text-muted-foreground">{e.purpose}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
