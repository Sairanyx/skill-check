import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { db, needs } from "@/db";
import { loadNeed } from "@/lib/services/needs";
import { acceptedFor, equivalentSuggestions } from "@/lib/services/company";
import { PROOF_TYPES } from "@/lib/proofs";
import { PageTitle, Section, Empty } from "@/components/app/ui";
import { NeedSettings, AcceptSimilar } from "@/components/app/need-settings";

export default async function EditNeedPage({ params }: PageProps<"/[lang]/company/needs/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "company");
  const need = await loadNeed(id).catch(() => null);
  if (!need || need.ownerId !== me.id) notFound();
  const row = (await db.query.needs.findFirst({ where: eq(needs.id, id) }))!;
  const [suggestions, accepted] = await Promise.all([equivalentSuggestions(me), acceptedFor(id)]);
  const similar = suggestions.filter((s) => s.myNeedId === id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href={`/${lang}/company`} className="text-sm text-muted-foreground hover:text-foreground">← Your needs</Link>
      <div className="mt-6">
        <PageTitle kicker={need.title} title="Edit need">
          {need.summary}
        </PageTitle>
      </div>

      {row.questionBankReview && !row.questionBankReview.ok && (
        <p className="mb-8 text-sm text-destructive">Your questions are not used until fixed: {row.questionBankReview.problems.join(" ")}</p>
      )}

      <NeedSettings
        needId={id}
        checkMode={row.checkMode}
        languageRequirements={row.languageRequirements ?? []}
        proofRequirements={row.proofRequirements ?? []}
        proofTypes={PROOF_TYPES.filter((p) => p.kind !== "language").map((p) => ({ code: p.code, label: p.label.en }))}
        questionBank={row.questionBank}
        anchors={row.anchors ?? []}
      />

      <Section title="Similar needs from other companies">
        <p className="mb-4 text-sm text-muted-foreground">If you accept one, people who passed a skill check there can share that result with you, so they do not have to take it twice.</p>
        {similar.length || accepted.length ? (
          <ul className="divide-y border-y text-sm">
            {accepted.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <span>{a.company}: {a.title}</span>
                <span className="text-primary">Accepted</span>
              </li>
            ))}
            {similar.map((s) => (
              <li key={s.otherNeedId} className="flex items-center justify-between gap-4 py-3">
                <span>
                  {s.company}: {s.otherTitle}
                  <span className="block text-xs text-muted-foreground">Shared skills: {s.shared.join(", ")}</span>
                </span>
                <AcceptSimilar needId={id} otherNeedId={s.otherNeedId} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No similar needs yet.</Empty>
        )}
      </Section>
    </div>
  );
}
