import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getCheck } from "@/lib/services/checks";
import { freeSlots } from "@/lib/services/decisions";
import { db, bookings, slots, rooms } from "@/db";
import { CheckRunner } from "@/components/app/check-runner";
import { BookMeeting } from "@/components/app/book-meeting";
import { PageTitle, Section, statusLabel, fmtTime } from "@/components/app/ui";
import type { EvaluationData } from "@/components/app/evaluation-view";

export default async function CheckPage({ params }: PageProps<"/[lang]/candidate/checks/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireRole(lang, "candidate");
  const check = await getCheck(me, id).catch(() => null);
  if (!check) notFound();

  const invited = check.decisions.find((d) => d.role === "company")?.decision === "invite";
  const [booking] = await db
    .select({ startsAt: slots.startsAt, room: rooms.name, qr: bookings.qrToken })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(rooms, eq(slots.roomId, rooms.id))
    .where(eq(bookings.checkId, id));
  const event = invited && !booking ? await db.query.events.findFirst() : null;
  const open = event ? await freeSlots(event.id) : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${lang}/candidate`} className="text-sm text-muted-foreground hover:text-foreground">← Skill checks</Link>
      <div className="mt-6">
        <PageTitle kicker={check.need.company} title={check.need.title}>
          {check.status === "in_progress" ? "About 6 short questions. Answer by voice or text." : statusLabel(check.status)}
        </PageTitle>
      </div>

      {invited && (
        <Section title={`${check.need.company} wants to meet you`}>
          {booking ? (
            <p className="text-sm">
              Your meeting: <strong>{fmtTime(booking.startsAt)}</strong>, {booking.room}. Show ticket code <span className="font-mono">{booking.qr.slice(0, 8).toUpperCase()}</span> at the door.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">Pick a 10 minute slot at Espoo Tech Talent Day. Your name is shared with the company only after you book.</p>
              <BookMeeting checkId={id} slots={open} />
            </>
          )}
        </Section>
      )}

      <CheckRunner
        checkId={id}
        lang={check.language}
        initialTurns={check.turns as { question: string; said?: string; seen: string }[]}
        pendingQuestion={check.pendingQuestion ?? null}
        evaluation={check.evaluation as EvaluationData | null}
      />
    </div>
  );
}
