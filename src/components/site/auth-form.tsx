"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type FormState } from "@/app/actions/auth";
import { LogoIcon } from "./logo";
import { formProblem } from "@/components/app/form-check";

export function AuthForm({ mode, lang }: { mode: "login" | "signup"; lang: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? signIn : signUp, {});
  const [role, setRole] = useState<"candidate" | "company">("candidate");
  const [problem, setProblem] = useState<string | null>(null);

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
      <LogoIcon className="size-10" />
      <h1 className="text-2xl font-semibold">{mode === "login" ? "Log in" : "Create an account"}</h1>
      <input type="hidden" name="lang" value={lang} />

      {mode === "signup" && (
        <>
          <fieldset className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="role" value="candidate" checked={role === "candidate"} onChange={() => setRole("candidate")} className="accent-primary" /> I am looking for work</label>
            <label className="flex items-center gap-2"><input type="radio" name="role" value="company" checked={role === "company"} onChange={() => setRole("company")} className="accent-primary" /> I am hiring</label>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="name">{role === "company" ? "Company name" : "Your name"}</Label>
            <Input id="name" name="name" required={role === "company"} placeholder={role === "company" ? "Example Oy" : ""} />
            {role === "candidate" && <p className="text-xs text-muted-foreground">Companies never see your name. They see an alias until you choose to share your contact.</p>}
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </div>
      {(problem ?? state.error) && <p className="text-sm text-destructive">{problem ?? state.error}</p>}
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={pending}>
        {mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <Link href={`/${lang}/signup`} className="text-primary hover:underline">New here? Create an account</Link>
        ) : (
          <Link href={`/${lang}/login`} className="text-primary hover:underline">Already have an account? Log in</Link>
        )}
      </p>
    </form>
  );
}
