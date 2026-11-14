"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

export function CancelAppointment({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="ghost" size="sm" disabled={busy} onClick={async () => { setBusy(true); await apiCall(`/appointments/${id}`, { method: "DELETE" }); router.refresh(); }}>
      Cancel
    </Button>
  );
}

type Need = { id: string; title: string; company: string; checkMode: string };
type Slot = { slotId: string; startsAt: string | Date; venue: string; room: string; workstation: string };

const day = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Helsinki" });
const time = (d: string | Date) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Helsinki" });

/** Booking: 1) choose up to 3 needs, 2) choose a place and time. Reschedule skips step 1. */
export function BookingForm({ lang, needs, slots, rescheduleId, initialNeeds = [], missing = {} }: { lang: string; needs: Need[]; slots: Slot[]; rescheduleId?: string; initialNeeds?: string[]; missing?: Record<string, string[]> }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(initialNeeds.filter((id) => needs.some((n) => n.id === id)).slice(0, 3));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toAdd = [...new Set(picked.flatMap((id) => missing[id] ?? []))];
  const ready = rescheduleId || (picked.length > 0 && toAdd.length === 0);

  // One row per place + time (first free workstation), so the list stays short.
  const options = new Map<string, Slot>();
  for (const s of slots) {
    const key = `${s.venue}|${new Date(s.startsAt).toISOString()}`;
    if (!options.has(key)) options.set(key, s);
  }

  async function choose(slotId: string) {
    setBusy(true);
    setError(null);
    try {
      if (rescheduleId) await apiCall(`/appointments/${rescheduleId}`, { method: "PATCH", json: { slotId } });
      else await apiCall("/appointments", { json: { slotId, needIds: picked } });
      router.push(`/${lang}/candidate`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {!rescheduleId && (
        <section>
          <h2 className="font-semibold">1. Which companies? <span className="font-normal text-muted-foreground">(up to 3)</span></h2>
          <ul className="mt-4 divide-y border-y">
            {needs.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-6 py-3 text-sm">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    disabled={n.checkMode === "off" || (!picked.includes(n.id) && picked.length >= 3)}
                    checked={picked.includes(n.id)}
                    onChange={(e) => setPicked((p) => (e.target.checked ? [...p, n.id] : p.filter((x) => x !== n.id)))}
                  />
                  <span>
                    <span className="text-muted-foreground">{n.company} · </span>
                    {n.title}
                  </span>
                </label>
                {missing[n.id] && <span className="text-xs text-muted-foreground">Needs: {missing[n.id].join(", ")}</span>}
                {n.checkMode === "off" && <span className="text-muted-foreground">No skill check needed, just come to the event</span>}
                {n.checkMode === "optional" && <span className="text-muted-foreground">Optional</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!rescheduleId && toAdd.length > 0 && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Add these proofs before you book</p>
          <p className="mt-1 text-muted-foreground">{toAdd.join(", ")}. City staff check the original when you come to the EXAM room. No copies are stored.</p>
          <Link href={`/${lang}/candidate/proofs`} className="mt-2 inline-block text-primary underline">Add proofs</Link>
        </div>
      )}

      <section className={ready ? "" : "pointer-events-none opacity-40"}>
        <h2 className="font-semibold">{rescheduleId ? "Choose a new time" : "2. Where and when?"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">30 minutes on a City computer in an EXAM room, like the ones Finnish universities use for exams. You can change the time until 2 hours before.</p>
        <ul className="mt-4 divide-y border-y">
          {[...options.values()].slice(0, 30).map((s) => (
            <li key={s.slotId} className="flex items-center justify-between gap-6 py-3 text-sm">
              <span>
                <strong>{day(s.startsAt)} {time(s.startsAt)}</strong> · {s.venue}, {s.room}
              </span>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => choose(s.slotId)}>Book</Button>
            </li>
          ))}
        </ul>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </section>
    </div>
  );
}
