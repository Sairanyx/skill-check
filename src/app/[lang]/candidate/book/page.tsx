import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { listNeeds } from "@/lib/services/needs";
import { freeTestSlots } from "@/lib/services/testing";
import { BookingForm } from "@/components/app/candidate-actions";
import { PageTitle } from "@/components/app/ui";
import { db, needs as needsTable } from "@/db";
import { myProofs } from "@/lib/services/proofs";
import { proofType } from "@/lib/proofs";
import { cefrAtLeast } from "@/lib/rules";

export default async function BookPage({ params, searchParams }: PageProps<"/[lang]/candidate/book">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const sp = await searchParams;
  const reschedule = sp.reschedule as string | undefined;
  const initialNeeds = typeof sp.needs === "string" ? sp.needs.split(",").filter(Boolean) : []; // from the event page
  const [needs, slots, mine, reqs] = await Promise.all([
    listNeeds(),
    freeTestSlots(),
    myProofs(me),
    db.select({ id: needsTable.id, proofs: needsTable.proofRequirements, languages: needsTable.languageRequirements }).from(needsTable),
  ]);
  // Proofs a job requires that this jobseeker has not added yet: they must be added before booking.
  const usable = mine.filter((p) => p.status !== "rejected");
  const has = (code: string, level?: string) => usable.some((p) => p.code === code && (!level || (!!p.level && cefrAtLeast(p.level, level))));
  const missing: Record<string, string[]> = {};
  for (const r of reqs) {
    const asked = [
      ...(r.proofs ?? []).filter((x) => x.required).map((x) => ({ code: x.code, level: undefined as string | undefined })),
      ...(r.languages ?? []).filter((l) => l.proof === "required").map((l) => ({ code: `language-${l.language}`, level: l.level as string })),
    ];
    const gaps = asked.filter((a) => !has(a.code, a.level)).map((a) => `${proofType(a.code)?.label.en ?? a.code}${a.level ? ` ${a.level}` : ""}`);
    if (gaps.length) missing[r.id] = gaps;
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm text-muted-foreground hover:text-foreground">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle title={reschedule ? "Change your time" : "Book a skill check"} />
      </div>
      <BookingForm lang={lang} needs={needs} slots={slots} rescheduleId={reschedule} initialNeeds={initialNeeds} missing={missing} />
    </div>
  );
}
