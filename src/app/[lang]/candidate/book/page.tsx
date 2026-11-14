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
  // Documents a job REQUIRES must be verified by City staff before booking. Optional ones never block.
  const matches = (p: (typeof mine)[number], code: string, level?: string) => p.code === code && (!level || (!!p.level && cefrAtLeast(p.level, level)));
  const status = (code: string, level?: string) =>
    mine.some((p) => p.status === "verified" && matches(p, code, level)) ? "verified" : mine.some((p) => p.status === "declared" && matches(p, code, level)) ? "waiting" : "missing";
  const missing: Record<string, string[]> = {};
  for (const r of reqs) {
    const asked = [
      ...(r.proofs ?? []).filter((x) => x.required).map((x) => ({ code: x.code, level: undefined as string | undefined })),
      ...(r.languages ?? []).filter((l) => l.proof === "required").map((l) => ({ code: `language-${l.language}`, level: l.level as string })),
    ];
    const gaps = asked
      .map((a) => ({ a, st: status(a.code, a.level) }))
      .filter((x) => x.st !== "verified")
      .map(({ a, st }) => `${proofType(a.code)?.label.en ?? a.code}${a.level ? ` ${a.level}` : ""} (${st === "waiting" ? "added, waiting for the City's check" : "not added yet"})`);
    if (gaps.length) missing[r.id] = gaps;
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm font-medium text-primary hover:underline">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle title={reschedule ? "Change your time" : "Book your EXAM room time"} />
      </div>
      {reschedule || initialNeeds.length ? (
        <BookingForm lang={lang} needs={reschedule ? needs : needs.filter((n) => initialNeeds.includes(n.id))} slots={slots} rescheduleId={reschedule} initialNeeds={initialNeeds} missing={missing} />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">Choose an event first. There you pick the companies you want to meet and see which skill checks they ask for.</p>
          <Link href={`/${lang}/candidate`} className="font-medium text-primary hover:underline">← Choose an event</Link>
        </div>
      )}
    </div>
  );
}
