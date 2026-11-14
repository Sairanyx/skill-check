import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { inArray } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { currentUser } from "@/lib/session";
import { kioskStatus, KIOSK_COOKIE, workstationFromToken, currentAppointmentAt } from "@/lib/services/testing";
import { db, needs, companies, skillChecks } from "@/db";
import { eq } from "drizzle-orm";
import { AuthForm } from "@/components/site/auth-form";
import { KioskGuard } from "@/components/app/kiosk-guard";
import { KioskStart } from "@/components/app/kiosk-start";
import { fmtTime } from "@/components/app/ui";
import { Logo } from "@/components/site/logo";

/** What a City testing-room computer shows. */
export default async function KioskPage({ params }: PageProps<"/[lang]/kiosk">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const token = (await cookies()).get(KIOSK_COOKIE)?.value;
  const status = await kioskStatus(token);
  if (!status)
    return <p className="mx-auto max-w-xl px-4 py-24 text-center text-muted-foreground">This is not a City testing-room computer.</p>;

  const me = await currentUser();
  const ws = await workstationFromToken(token);
  const turn = ws ? await currentAppointmentAt(ws.id) : null;
  const mine = me && turn && turn.appointment.candidateId === me.id ? turn : null;

  const booked = mine
    ? await db.select({ id: needs.id, title: needs.title, company: companies.name }).from(needs).innerJoin(companies, eq(needs.companyId, companies.id)).where(inArray(needs.id, mine.appointment.needIds))
    : [];
  const started = mine ? await db.select({ needId: skillChecks.needId, id: skillChecks.id, finishedAt: skillChecks.finishedAt }).from(skillChecks).where(eq(skillChecks.appointmentId, mine.appointment.id)) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Logo size="lg" className="mb-10" />
      <p className="text-sm text-muted-foreground">{status.venue} · {status.room}</p>
      <h1 className="mt-1 text-3xl font-semibold">{status.workstation}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {status.current
          ? `Reserved ${fmtTime(status.current.startsAt)} to ${new Date(status.current.endsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Helsinki" })}`
          : status.next
            ? `Next booking ${fmtTime(status.next.startsAt)}`
            : "No bookings right now"}
      </p>

      {!me && <AuthForm mode="login" lang={lang} />}

      {mine && (
        <>
          <KioskGuard lang={lang} endsAt={new Date(mine.slot.endsAt).toISOString()} />
          <ul className="mt-12 divide-y border-y">
            {booked.map((n) => {
              const s = started.find((x) => x.needId === n.id);
              return (
                <li key={n.id} className="flex items-center justify-between gap-6 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{n.company}</p>
                    <p className="font-medium">{n.title}</p>
                  </div>
                  {s?.finishedAt ? <span className="text-sm text-muted-foreground">Done</span> : <KioskStart needId={n.id} lang={lang} label={s ? "Continue" : "Start"} />}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {me && !mine && me.role === "city" && <p className="mt-12 text-sm text-muted-foreground">You are logged in as City staff. Log out so the booked person can log in.</p>}
    </div>
  );
}
