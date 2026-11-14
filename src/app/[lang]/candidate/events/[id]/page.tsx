import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { db, events, eventCompanies, companies, needs } from "@/db";
import { PageTitle, fmtTime, eventMode } from "@/components/app/ui";
import { EventPicker, type EventCompany } from "@/components/app/event-picker";

/** Jobseeker: which companies come to this event, and what each one asks for (read only). */
export default async function EventPage({ params }: PageProps<"/[lang]/candidate/events/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "candidate");
  const event = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!event) notFound();

  const coming = await db
    .select({ companyId: companies.id, name: companies.name, sector: companies.sector, description: companies.description, checkMode: eventCompanies.checkMode })
    .from(eventCompanies)
    .innerJoin(companies, eq(companies.id, eventCompanies.companyId))
    .where(and(eq(eventCompanies.eventId, id), isNotNull(eventCompanies.approvedAt)));
  const jobs = coming.length
    ? await db.select().from(needs).where(inArray(needs.companyId, coming.map((c) => c.companyId)))
    : [];
  const list: EventCompany[] = coming
    .map((c) => ({
      id: c.companyId,
      name: c.name,
      sector: c.sector ?? "",
      about: (c.description ?? "").replace("Fictional company for the Skill Check demo. ", ""),
      mode: event.checkPolicy === "none" ? "off" : c.checkMode,
      jobs: jobs
        .filter((j) => j.companyId === c.companyId)
        .map((j) => ({ id: j.id, title: j.title, summary: j.summary, level: j.level, languages: j.languageRequirements ?? [], proofs: j.proofRequirements ?? [] })),
    }))
    .filter((c) => c.jobs.length)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm font-medium text-primary hover:underline">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle kicker={`${eventMode(event.mode)} · ${fmtTime(event.startsAt)}${event.location ? ` · ${event.location}` : ""}`} title={event.title}>
          Choose the companies you want to meet. You see what each one asks for. Then book the skill checks you need, in one visit to an EXAM room.
        </PageTitle>
      </div>
      <EventPicker lang={lang} companies={list} />
    </div>
  );
}
