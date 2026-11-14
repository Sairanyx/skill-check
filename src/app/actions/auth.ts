"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { db, user } from "@/db";
import { auth, type Role } from "@/lib/auth";
import { assertKioskTurn, KIOSK_COOKIE } from "@/lib/services/testing";
import { ApiError } from "@/lib/api";

export type FormState = { error?: string };

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const lang = String(form.get("lang"));
  try {
    await auth.api.signInEmail({
      body: { email: String(form.get("email")), password: String(form.get("password")) },
      headers: await headers(),
    });
  } catch {
    return { error: "Wrong email or password." };
  }
  const u = await db.query.user.findFirst({ where: eq(user.email, String(form.get("email")).toLowerCase()) });

  // On a City testing-room computer, only the person booked for this workstation and time may log in.
  const kiosk = (await cookies()).get(KIOSK_COOKIE)?.value;
  if (kiosk && u && u.role !== "city") {
    try {
      if (u.role !== "candidate") throw new ApiError(403, "This computer is for skill checks only");
      await assertKioskTurn({ id: u.id, name: u.name, email: u.email, role: "candidate" }, kiosk);
    } catch (e) {
      await auth.api.signOut({ headers: await headers() });
      return { error: e instanceof Error ? e.message : "Not allowed on this computer" };
    }
    redirect(`/${lang}/kiosk`);
  }
  redirect(`/${lang}/${u?.role ?? "candidate"}`);
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const lang = String(form.get("lang"));
  const requested = String(form.get("role"));
  const role: Role = requested === "company" ? "company" : "candidate"; // "city" is never allowed here
  const email = String(form.get("email")).toLowerCase();

  try {
    await auth.api.signUpEmail({
      body: { name: String(form.get("name") || "Candidate"), email, password: String(form.get("password")) },
      headers: await headers(),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the account." };
  }
  await db.update(user).set({ role }).where(eq(user.email, email)); // role set by the server, not the browser
  redirect(`/${lang}/${role}`);
}

export async function signOut(lang: string) {
  await auth.api.signOut({ headers: await headers() });
  redirect(`/${lang}`);
}
