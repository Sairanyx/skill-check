import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { db, user, proofs, skillChecks, needs, companies, evaluations } from "@/db";
import { aliasFor } from "@/lib/alias";
import { proofType } from "@/lib/proofs";
import { audit } from "@/lib/services/audit";
import { PageTitle, Section, Empty, statusLabel, fmtTime } from "@/components/app/ui";
import { VerifyProof } from "@/components/app/proof-actions";

const PROOF_STATUS = { declared: "Waiting for your check", verified: "Verified", rejected: "Not accepted" } as const;

/** City staff: one jobseeker's profile. Documents to check, skill checks with AI feedback, links to the conversations. */
export default async function PersonPage({ params }: PageProps<"/[lang]/city/people/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "city");
  const person = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!person || person.role !== "candidate") notFound();
  await audit({ id: me.id, name: me.name, email: me.email, role: "city" }, "profile.viewed", { subjectId: id, targetType: "user", targetId: id });

  const [docs, checks] = await Promise.all([
    db.select().from(proofs).where(eq(proofs.candidateId, id)).orderBy(desc(proofs.createdAt)),
    db
      .select({ id: skillChecks.id, status: skillChecks.status, finishedAt: skillChecks.finishedAt, need: needs.title, company: companies.name, match: evaluations.match, confidence: evaluations.confidence })
      .from(skillChecks)
      .innerJoin(needs, eq(needs.id, skillChecks.needId))
      .innerJoin(companies, eq(companies.id, needs.companyId))
      .leftJoin(evaluations, eq(evaluations.checkId, skillChecks.id))
      .where(eq(skillChecks.candidateId, id))
      .orderBy(desc(skillChecks.startedAt)),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/city`} className="text-sm font-medium text-primary hover:underline">← City overview</Link>
      <div className="mt-6">
        <PageTitle kicker={`Jobseeker · shown to companies as ${aliasFor(id)}`} title={person.name}>
          Opening this profile is recorded in the audit log.
        </PageTitle>
      </div>

      <Section title="Documents">
        {docs.length ? (
          <ul className="divide-y border-y text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <span>
                  <span className="font-medium">{proofType(d.code)?.label.en ?? d.code}</span>
                  {d.level ? `, ${d.level}` : ""}
                  <span className="ml-2 text-muted-foreground">{PROOF_STATUS[d.status]}</span>
                  {d.status === "declared" && <span className="block text-xs text-muted-foreground">{proofType(d.code)?.check}</span>}
                  {d.method && <span className="block text-xs text-muted-foreground">Checked: {d.method}</span>}
                </span>
                {d.status === "declared" && <VerifyProof id={d.id} howToCheck={proofType(d.code)?.check ?? "Original seen"} />}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No documents added.</Empty>
        )}
      </Section>

      <Section title="Skill checks">
        {checks.length ? (
          <ul className="divide-y border-y text-sm">
            {checks.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <span>
                  <span className="text-muted-foreground">{c.company} · </span>
                  <span className="font-medium">{c.need}</span>
                  <span className="block text-xs text-muted-foreground">
                    {statusLabel(c.status)}
                    {c.match != null ? ` · AI feedback ${c.match}/10, confidence ${Math.round((c.confidence ?? 0) * 100)}%` : ""}
                    {c.finishedAt ? ` · ${fmtTime(c.finishedAt)}` : ""}
                  </span>
                </span>
                <Link href={`/${lang}/city/review/${c.id}`} className="text-primary hover:underline">Conversation and decision →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No skill checks yet.</Empty>
        )}
      </Section>
    </div>
  );
}
