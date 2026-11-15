"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { hasLocale } from "@/i18n/config";
import { allow, clientIp } from "@/lib/rate-limit";
import { startCheck } from "@/lib/services/checks";
import { DEMO_VISIT_MINUTES, discardDemoVisit, openDemoVisit, panelReachable, pickDemoNeed } from "@/lib/services/demo";
import { KIOSK_COOKIE } from "@/lib/services/testing";

export type DemoState = { error?: string };

const HOUR = 60 * 60_000;

/**
 * DEMO ONLY: one click from /demo into a real skill check.
 * Creates a visitor account, books it into a demo EXAM room computer starting now (see services/demo.ts),
 * marks this browser as that computer for the visit, and starts the check with the real privacy guard and panel.
 */
export async function startDemoCheck(_: DemoState, form: FormData): Promise<DemoState> {
  const lang = String(form.get("lang"));
  const language = String(form.get("language"));
  if (!hasLocale(lang) || !hasLocale(language)) return { error: "Choose a language." };
  // Every check uses AI credits: generous per address (judges share a network), capped per day.
  if (!allow(`demo:ip:${clientIp(await headers())}`, 20, HOUR) || !allow("demo:all", 300, 24 * HOUR))
    return { error: "The demo is busy. Please try again in a few minutes." };

  if (!panelReachable()) return { error: "Skill checks run on the live server. Try it at skillcheck.fi/demo." };

  let checkId: string;
  let visitorId: string | null = null;
  let workstationId: string | null = null;
  try {
    // A random job unless one is chosen, so every visitor starts with one click. Checked before an account is made.
    const needId = await pickDemoNeed(form.get("needId") ? String(form.get("needId")) : null);
    const tag = randomBytes(2).toString("hex").toUpperCase();
    const email = `visitor-${randomBytes(6).toString("hex")}@try.skillcheck.fi`;
    const { user } = await auth.api.signUpEmail({
      body: { name: `Visitor ${tag}`, email, password: randomBytes(18).toString("base64url") },
      headers: await headers(),
    }); // also logs this browser in as the visitor
    const visitor = { id: user.id, name: user.name, email, role: "candidate" as const };
    visitorId = visitor.id;
    const visit = await openDemoVisit(visitor, needId);
    workstationId = visit.workstationId;
    const token = visit.token;
    // The EXAM room mark lasts only for the visit, so the browser is normal again afterwards.
    (await cookies()).set(KIOSK_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: (DEMO_VISIT_MINUTES + 15) * 60 });
    ({ checkId } = await startCheck(visitor, needId, language, token));
  } catch (e) {
    // Leave the browser as it was: no EXAM room mark, no half-made visitor login.
    (await cookies()).delete(KIOSK_COOKIE);
    await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
    if (visitorId) await discardDemoVisit(visitorId, workstationId).catch((err) => console.error("demo cleanup failed", err));
    if (e instanceof ApiError && e.status === 503) return { error: "The AI panel is busy right now. Please try again in a moment." };
    return { error: e instanceof Error ? e.message : "Could not start the skill check. Please try again." };
  }
  redirect(`/${lang}/demo/check/${checkId}`);
}

/** Ends the demo visit: this browser stops being an EXAM room computer and the visitor is logged out. */
export async function endDemoVisit(lang: string) {
  (await cookies()).delete(KIOSK_COOKIE);
  await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
  redirect(`/${hasLocale(lang) ? lang : "en"}/demo`);
}
