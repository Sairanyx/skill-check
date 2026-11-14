import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { listNeeds } from "@/lib/services/needs";
import { freeTestSlots } from "@/lib/services/testing";
import { BookingForm } from "@/components/app/candidate-actions";
import { PageTitle } from "@/components/app/ui";

export default async function BookPage({ params, searchParams }: PageProps<"/[lang]/candidate/book">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "candidate");
  const reschedule = (await searchParams).reschedule as string | undefined;
  const [needs, slots] = await Promise.all([listNeeds(), freeTestSlots()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm text-muted-foreground hover:text-foreground">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle title={reschedule ? "Change your time" : "Book a skill check"} />
      </div>
      <BookingForm lang={lang} needs={needs} slots={slots} rescheduleId={reschedule} />
    </div>
  );
}
