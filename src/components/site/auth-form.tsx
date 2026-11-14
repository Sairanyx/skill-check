"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type FormState } from "@/app/actions/auth";
import { LogoIcon } from "./logo";
import { formProblem } from "@/components/app/form-check";
import { leaveKioskMode } from "@/app/actions/kiosk";

type Role = "candidate" | "company" | "city";
const TABS: { role: Role; label: string }[] = [
  { role: "candidate", label: "Jobseeker" },
  { role: "company", label: "Company" },
  { role: "city", label: "City of Espoo" },
];
/** Ready-made demo accounts, one per side (synthetic data only). */
const DEMO: Record<Role, { email: string; who: string }> = {
  candidate: { email: "aino@demo.skillcheck.fi", who: "Aino Mäkelä, a jobseeker" },
  company: { email: "recruiter@kauklahtiparcel.demo", who: "Kauklahti Parcel Oy, a logistics company" },
  city: { email: "events@espoo.demo", who: "City of Espoo employment services" },
};
const DEMO_PASSWORD = "junction2026";

export function AuthForm({ mode, lang, role: initialRole = "candidate" }: { mode: "login" | "signup"; lang: string; role?: Role }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? signIn : signUp, {});
  const role = mode === "signup" && initialRole === "city" ? "candidate" : initialRole;
  const [problem, setProblem] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const kioskBlocked = mode === "login" && !cleared && /computer|workstation/i.test(state.error ?? "");

  return (
    <form
      action={action}
      noValidate
      onSubmit={(e) => {
        const p = formProblem(e.currentTarget);
        setProblem(p);
        if (p) e.preventDefault();
      }}
      className="mx-auto mt-16 max-w-sm space-y-5 px-4"
    >
      <Link href={`/${lang}`} className="text-sm font-medium text-primary hover:underline">← Home</Link>
      <LogoIcon className="size-10" />
      <h1 className="text-2xl font-semibold">{mode === "login" ? "Log in" : "Create an account"}</h1>
      <nav className="flex gap-1 rounded-lg bg-muted p-1 text-sm" aria-label="Who are you?">
        {TABS.filter((t) => mode === "login" || t.role !== "city").map((t) => (
          <Link
            key={t.role}
            href={`/${lang}/${mode}?as=${t.role}`}
            aria-current={t.role === role ? "page" : undefined}
            className={`flex-1 rounded-md px-3 py-1.5 text-center ${t.role === role ? "bg-background font-medium text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <input type="hidden" name="lang" value={lang} />
      {mode === "login" && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <p>
            Demo account filled in: <strong>{DEMO[role].who}</strong>. Just press Log in.
          </p>
        </div>
      )}

      {mode === "signup" && (
        <>
          <input type="hidden" name="role" value={role} />
          <div className="space-y-2">
            <Label htmlFor="name">{role === "company" ? "Company name" : "Your name"}</Label>
            <Input id="name" name="name" required={role === "company"} placeholder={role === "company" ? "Example Oy" : ""} />
            {role === "candidate" && <p className="text-xs text-muted-foreground">Companies never see your name. They see an alias until you choose to share your contact.</p>}
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input key={`e-${role}`} id="email" name="email" type="email" required autoComplete={mode === "login" ? "off" : "email"} defaultValue={mode === "login" ? DEMO[role].email : undefined} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input key={`p-${role}`} id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "off" : "new-password"} defaultValue={mode === "login" ? DEMO_PASSWORD : undefined} />
      </div>
      {kioskBlocked ? (
        <div className="rounded-lg border border-destructive/40 p-3 text-sm">
          <p className="text-destructive">This browser is set up as an EXAM room computer, so only the person booked on it can log in.</p>
          <button
            type="button"
            className="mt-1 text-primary underline"
            onClick={async () => {
              await leaveKioskMode();
              setCleared(true);
            }}
          >
            Use this browser normally again
          </button>
        </div>
      ) : (
        (problem ?? (cleared ? null : state.error)) && <p className="text-sm text-destructive">{problem ?? state.error}</p>
      )}
      {cleared && <p className="text-sm text-primary">Done. This is a normal browser again. Press Log in.</p>}
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={pending}>
        {mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          role !== "city" ? <Link href={`/${lang}/signup?as=${role}`} className="text-primary hover:underline">New here? Create an account</Link> : <span>City accounts are created by the City.</span>
        ) : (
          <Link href={`/${lang}/login?as=${role}`} className="text-primary hover:underline">Already have an account? Log in</Link>
        )}
      </p>
    </form>
  );
}
