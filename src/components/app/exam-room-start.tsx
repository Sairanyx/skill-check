"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * DEMO: start the booked skill check from the jobseeker's own page.
 * In real use the check only runs on the City computer in the EXAM room (EXAM-room model).
 * The pop-up says so, then asks the server (demo mode) to treat this browser as that computer.
 */
export function ExamRoomStart({ appointmentId, place, lang }: { appointmentId: string; place: string; lang: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/appointments/${appointmentId}/demo-start`, { method: "POST" });
    if (res.ok) return router.push(`/${lang}/kiosk`);
    setBusy(false);
    if (res.status === 404 || res.status === 405 || res.status === 403) return setUnavailable(true);
    setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not start");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Start skill check</Button>
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="exam-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Demo</p>
            <h2 id="exam-title" className="text-xl font-semibold">You are in the EXAM room</h2>
            <p className="text-sm text-muted-foreground">
              Normally you can only take the skill check on the City computer you booked, in the EXAM room, during your time. You cannot start it from home or from your own laptop.
            </p>
            <p className="text-sm">
              For this demo, imagine you are now sitting at <strong>{place}</strong>, logged in on the City computer.
            </p>
            {unavailable ? (
              <p className="text-sm text-muted-foreground">
                The one-click start is not switched on yet. Use the <Link href={`/${lang}/demo`} className="text-primary underline">demo page</Link> instead.
              </p>
            ) : (
              error && <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              {!unavailable && (
                <Button onClick={start} disabled={busy}>
                  {busy ? "Opening…" : "Start my skill check"}
                </Button>
              )}
              <button className={buttonVariants({ variant: "outline" })} onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
