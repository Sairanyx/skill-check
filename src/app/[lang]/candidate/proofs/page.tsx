import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { myProofs } from "@/lib/services/proofs";
import { PROOF_TYPES, proofType } from "@/lib/proofs";
import { PageTitle, Section, Empty } from "@/components/app/ui";
import { AddProof, RemoveProof } from "@/components/app/proof-actions";

const STATUS = { declared: "Bring the original to your visit", verified: "Verified by the City", rejected: "Not accepted" } as const;

export default async function ProofsPage({ params }: PageProps<"/[lang]/candidate/proofs">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const proofs = await myProofs(me);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm text-muted-foreground hover:text-foreground">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle title="Proofs">
          No CV, no cover letter. Add only official proofs that a job asks for, like a hygiene passport, a nurse licence or a language certificate. City staff check the original when you come to the EXAM room. Companies only see that it is verified.
        </PageTitle>
      </div>

      <Section title="Your proofs">
        {proofs.length ? (
          <ul className="divide-y border-y text-sm">
            {proofs.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-6 py-3">
                <span>
                  {proofType(p.code)?.label.en ?? p.code}
                  {p.level ? `, ${p.level}` : ""}
                  <span className={`ml-3 ${p.status === "verified" ? "text-primary" : "text-muted-foreground"}`}>{STATUS[p.status]}</span>
                </span>
                <RemoveProof id={p.id} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No proofs yet.</Empty>
        )}
      </Section>

      <Section title="Add a proof">
        <AddProof types={PROOF_TYPES} />
      </Section>
    </div>
  );
}
