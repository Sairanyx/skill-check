# Backend requests (front end → Chris)

Small backend changes the front end needs. The front end is already built and falls back safely until they exist.

## 1. Demo start: `POST /api/v1/appointments/:id/demo-start`

**Why:** judges should start their booked skill check from the jobseeker page, without logging in as City staff first. The "Start skill check" button and the EXAM-room pop-up are live (`src/components/app/exam-room-start.tsx`). Until this endpoint exists, the pop-up sends people to `/demo`.

**Rule:** only when the server setting `DEMO_MODE=true`. Only the jobseeker's own booking, only during its time (from 10 minutes before the start). It does what "Use this computer" does for that workstation, then sets the kiosk cookie. The kiosk rules stay as they are.

**Service** (`src/lib/services/testing.ts`, next to `enrollWorkstation`):
```ts
export const isDemoMode = () => process.env.DEMO_MODE === "true";

/** DEMO ONLY: the jobseeker's browser becomes the computer they are booked on, during their slot. */
export async function demoStartOnKiosk(actor: ApiUser, appointmentId: string) {
  if (!isDemoMode()) throw new ApiError(403, "Only available in the demo");
  const a = await ownAppointment(actor, appointmentId);
  if (a.status !== "booked" && a.status !== "in_progress") throw new ApiError(409, "This booking is not active");
  const slot = await db.query.testSlots.findFirst({ where: eq(testSlots.id, a.slotId) });
  const now = Date.now();
  if (!slot || slot.startsAt.getTime() - LOGIN_GRACE_MS > now || slot.endsAt.getTime() <= now) throw new ApiError(409, "Your testing time has not started yet");
  const result = await enrollWorkstation(actor, slot.workstationId);
  await audit(actor, "workstation.demo_start", { subjectId: actor.id, targetType: "workstation", targetId: slot.workstationId });
  return result;
}
```

**Route** (`src/app/api/v1/appointments/[id]/demo-start/route.ts`):
```ts
import { NextResponse } from "next/server";
import { ApiError, caller } from "@/lib/api";
import { demoStartOnKiosk, KIOSK_COOKIE } from "@/lib/services/testing";

export async function POST(req: Request, { params }: RouteContext<"/api/v1/appointments/[id]/demo-start">) {
  try {
    const me = await caller(req, ["candidate"]);
    const { token } = await demoStartOnKiosk(me, (await params).id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(KIOSK_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 4 });
    return res;
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status });
  }
}
```

**Then:** `npx next typegen`, add `DEMO_MODE=true` to the server `.env`, deploy. Remove or set `DEMO_MODE=false` for a real pilot.

## 2. Scoring and bias with the panel (parked, to discuss)
**Problem:** with the panel scoring, two responsible-AI layers are off: the separate fairness check (fairness flags are always empty) and the measured benchmark (D20 measured our scoring, not the panel's). The panel's three judges are all Google models and use the mean.
**Proposal (option 1):** the panel interviews, our evaluator scores. When the panel returns `done`, call `evaluate(need, agentTurns(turns))` in `answerCheck` instead of waiting for `panelReport()`. Keep the panel report as a second opinion in `method.panel` when it arrives. Brings back judges from three companies, the median, the fairness check, and keeps D20 valid. Faster too (about 10 s instead of 1 to 3 min).
**Minimum alternative:** keep the panel scoring and run our fairness auditor on the transcript plus the panel scores.

## 3. Two small messages
- When the testing time is over, answering says "This workstation is reserved for someone else right now". Better: "Your testing time has ended."
- The panel ignores small talk ("Oh hello!") and repeats the question. Better: one short friendly sentence, then the question (Chris is on it).

## 4. New companies are stuck without a company profile (important)
**Problem:** a company that signs up has no row in `companies`. The company portal then shows no events, and adding a need fails with "Create your company profile first". Nothing outside the seed creates that row, so every real company hits a dead end.
**Front end (done):** at sign-up, "I am hiring" now asks for **Company name** (required).
**Backend fix** in `signUp` (`src/app/actions/auth.ts`), right after the role update:
```ts
if (role === "company") {
  const u = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (u && !(await db.query.companies.findFirst({ where: eq(companies.ownerId, u.id) })))
    await db.insert(companies).values({ name: String(form.get("name") || "New company"), ownerId: u.id });
}
```
(import `companies` from `@/db`). Then the new company sees the events and can add needs straight away.

## 2. Done by the front end, for your review: "Try a skill check" on /demo

Eduard asked for this on 15 Nov so judges can take a real check without a booking or City login. New files only, no existing rule changed:
- `src/lib/services/demo.ts`: picks a demo job (by title), makes a computer in a "SkillCheck demo" EXAM room, a 30-minute slot starting now, a booking, and enrols the computer as the City account.
- `src/app/actions/demo.ts`: makes a visitor account, calls the above, sets the kiosk cookie for 45 minutes, starts the check with `startCheck`. On any error it clears the cookie and logs out. Rate limit: 20 per hour per address, 300 per day.
- `src/app/[lang]/demo/check/[id]/page.tsx`: the visitor's check, using the normal answer API.

Side effects to know: visitor accounts (`visitor-…@try.skillcheck.fi`) and their checks are normal rows, so their results reach the company and City lists. If that is too noisy, filtering that email domain out of `reviewQueue`, `cityMatchingList` and the company candidate list would fix it.
