import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { KIOSK_COOKIE } from "@/lib/services/testing";
import { ConsentToggle } from "@/components/app/consent-toggle";
import { sharedContact as sharedContactFor } from "@/lib/services/privacy";
import { eq } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { getCheck } from "@/lib/services/checks";
import { loadNeed } from "@/lib/services/needs";
import type { SkillAnchor } from "@/components/app/evaluation-view";
import { freeSlots, outcomes } from "@/lib/services/decisions";
import { db, bookings, meetingSlots, meetingRooms } from "@/db";
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
  const onKiosk = !!(await cookies()).get(KIOSK_COOKIE)?.value;
  const need = await loadNeed(check.need.id).catch(() => null);

  const accepted = (await outcomes(id)).filter((o) => o.accepted);
  const invited = accepted.length > 0;
  const [booking] = await db
    .select({ startsAt: meetingSlots.startsAt, room: meetingRooms.name, companyId: bookings.companyId })
    .from(bookings)
    .innerJoin(meetingSlots, eq(bookings.slotId, meetingSlots.id))
    .innerJoin(meetingRooms, eq(meetingSlots.roomId, meetingRooms.id))
    .where(eq(bookings.checkId, id));
  const contactShared = booking ? !!(await sharedContactFor(me.id, booking.companyId)) : false;
  const event = invited && !booking ? await db.query.events.findFirst() : null;
  const open = event ? await freeSlots(event.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${lang}/${onKiosk ? "kiosk" : "candidate"}`} className="text-sm font-medium text-primary hover:underline">← {onKiosk ? "Back" : "Skill checks"}</Link>
      <div className="mt-6">
        <PageTitle kicker={check.need.company} title={check.need.title}>
          {check.status === "in_progress" ? "Answer by voice or text. The interview ends when the panel has heard enough." : statusLabel(check.status)}
        </PageTitle>
      </div>

      {invited && (
        <Section title={`Accepted for ${accepted.map((a) => a.company).join(", ")}`}>
          {booking ? (
            <>
            <p className="text-sm">
              Your meeting: <strong>{fmtTime(booking.startsAt)}</strong>, {booking.room}.
            </p>
            <div className="mt-4">
              <ConsentToggle
                path="/me/contact-shares"
                field="share"
                extra={{ companyId: booking.companyId }}
                initial={contactShared}
                label={`Share my email with ${check.need.company}. Without this, they only see your alias until you meet.`}
              />
            </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">Pick a 15 minute slot at Espoo Tech Talent Day. The company sees your name only if you choose to share your contact details.</p>
              <BookMeeting checkId={id} slots={open} />
            </>
          )}
        </Section>
      )}

      <CheckRunner
        anchors={(need?.anchors ?? []) as SkillAnchor[]}
        kiosk={onKiosk}
        checkId={id}
        lang={check.language}
        initialTurns={check.turns as { question: string; said?: string; seen: string }[]}
        pendingQuestion={check.pendingQuestion ?? null}
        evaluation={check.evaluation as EvaluationData | null}
      />

      {check.status !== "in_progress" && !onKiosk && (
        <div className="mt-12">
          <Section title="Sharing">
            <ConsentToggle
              path={`/checks/${id}/share`}
              field="share"
              initial={check.shareWithEquivalent}
              label="Share this result with other companies that accept it for a similar role, so I do not need to take the same check again."
            />
          </Section>
        </div>
      )}
    </div>
  );
}
