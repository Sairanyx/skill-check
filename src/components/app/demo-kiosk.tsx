"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formProblem } from "./form-check";

/**
 * DEMO ONLY (front end). Opens a jobseeker's booked skill check in this browser in one click.
 * It does the same steps a person would do by hand, with the existing APIs:
 * 1. log in as the jobseeker and find the booking running now,
 * 2. log in as City staff and set up that EXAM room computer ("Use this computer"),
 * 3. log in as the jobseeker again and open the kiosk.
 * The server rules do not change: the check still only runs on the booked computer, in the booked time.
 */
const post = (path: string, body?: unknown) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });

async function signIn(email: string, password: string) {
  const r = await post("/api/auth/sign-in/email", { email, password });
  if (!r.ok) throw new Error(`Could not log in as ${email}`);
}
const signOut = () => post("/api/auth/sign-out");

type Appointment = { status: string; startsAt: string; endsAt: string; venue: string; room: string; workstation: string };
type Workstation = { id: string; label: string; room: string; venue: string };

export function DemoKiosk({ lang }: { lang: string }) {
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(f: FormData) {
    const jobseeker = String(f.get("jobseeker")), password = String(f.get("password"));
    const city = String(f.get("city")), cityPassword = String(f.get("cityPassword"));
    setError(null);
    try {
      setStep("Finding your testing time…");
      await signOut();
      await signIn(jobseeker, password);
      const appts = (await (await fetch("/api/v1/appointments")).json()) as Appointment[];
      const now = Date.now();
      const current = appts.find((a) => ["booked", "in_progress"].includes(a.status) && new Date(a.startsAt).getTime() - 10 * 60_000 <= now && new Date(a.endsAt).getTime() > now);
      if (!current) throw new Error("This jobseeker has no testing time running now. Book one first.");

      setStep(`Setting up ${current.workstation} as City staff…`);
      await signOut();
      await signIn(city, cityPassword);
      const stations = (await (await fetch("/api/v1/workstations")).json()) as Workstation[];
      const ws = stations.find((w) => w.venue === current.venue && w.room === current.room && w.label === current.workstation);
      if (!ws) throw new Error("Could not find the booked computer");
      if (!(await post(`/api/v1/workstations/${ws.id}/enroll`)).ok) throw new Error("Could not set up the computer");

      setStep("Opening your skill check…");
      await signOut();
      await signIn(jobseeker, password);
      // A full reload on purpose: the kiosk must load with the new login and kiosk cookies.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/${lang}/kiosk`;
    } catch (e) {
      setError((e as Error).message);
      setStep(null);
    }
  }

  return (
    <form
      noValidate
      className="max-w-md space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const problem = formProblem(e.currentTarget);
        if (problem) return setError(problem);
        run(new FormData(e.currentTarget));
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="jobseeker">Jobseeker</Label>
        <Input id="jobseeker" name="jobseeker" defaultValue="tester@demo.skillcheck.fi" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Jobseeker password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City staff (sets up the computer)</Label>
        <Input id="city" name="city" defaultValue="events@espoo.demo" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cityPassword">City staff password</Label>
        <Input id="cityPassword" name="cityPassword" type="password" required />
      </div>
      <Button type="submit" size="lg" disabled={!!step}>{step ?? "Open my skill check"}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
