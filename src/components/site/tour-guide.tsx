"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, TOUR_KEY, type TourState } from "./tour";

const save = (s: TourState | null) => {
  try {
    if (s) sessionStorage.setItem(TOUR_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(TOUR_KEY);
  } catch {}
  window.dispatchEvent(new Event("sc-tour"));
};
const subscribe = (cb: () => void) => {
  window.addEventListener("sc-tour", cb);
  return () => window.removeEventListener("sc-tour", cb);
};
const snapshot = () => {
  try {
    return sessionStorage.getItem(TOUR_KEY);
  } catch {
    return null;
  }
};
const post = (path: string, body?: unknown) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });

/** Go to a step: log in as the right demo account if needed, then open the page. */
export async function goToStep(s: TourState, i: number) {
  const step = s.steps[i];
  save({ ...s, step: i });
  const prevAs = s.steps.slice(0, i).reverse().find((x) => x.as)?.as;
  const current = s.steps[s.step]?.as ?? prevAs ?? null;
  if (step.as && (step.as !== current || i === 0 || s.step === i)) {
    await post("/api/auth/sign-out");
    await post("/api/auth/sign-in/email", { email: DEMO_ACCOUNTS[step.as], password: DEMO_PASSWORD });
  }
  if (!step.as) await post("/api/auth/sign-out"); // intro and end: nobody is logged in
  // A full load on purpose: the new login must apply to the whole page.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/${s.lang}${step.path}`;
}

/** Leaving the demo always logs the demo account out and returns to the home page. */
async function endTour(lang: string) {
  save(null);
  await post("/api/auth/sign-out");
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/${lang}`;
}

/** The floating guide shown on every page while the tour runs. */
export function TourGuide() {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const tour = useMemo<TourState | null>(() => (raw ? JSON.parse(raw) : null), [raw]);
  const setTour = (t: TourState | null) => save(t);
  const lit = useRef<Element | null>(null);
  const step = tour?.steps[tour.step];
  const onPage = !!step && pathname === `/${tour!.lang}${step.path.split("?")[0]}`.replace(/\/$/, "");

  // Highlight and scroll to the part of the page this step is about.
  useEffect(() => {
    lit.current?.classList.remove("tour-highlight");
    if (!onPage || !step?.highlight) return;
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => {
      const el = document.querySelector(step.highlight!);
      if (!el) return;
      el.classList.add("tour-highlight");
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: "smooth", block: "center" });
      lit.current = el;
    }, 400);
    return () => clearTimeout(t);
  }, [onPage, step]);

  const next = useCallback(() => {
    if (!tour) return;
    if (tour.step >= tour.steps.length - 1) return void endTour(tour.lang);
    const s = { ...tour };
    const n = tour.step + 1;
    // Same page, next part (e.g. conversation, then feedback): no reload needed.
    if (tour.steps[n].path === tour.steps[tour.step].path && tour.steps[n].as === tour.steps[tour.step].as) {
      save({ ...s, step: n });
      return;
    }
    goToStep({ ...s, step: tour.step }, n);
  }, [tour]);


  if (!tour || !step) return null;
  const n = tour.step;

  return (
    <div role="dialog" aria-label="Guided demo" className="fixed bottom-6 left-1/2 z-50 w-[min(94vw,820px)] -translate-x-1/2 rounded-2xl border-2 border-primary bg-background p-6 shadow-2xl md:p-8">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="font-medium uppercase tracking-wide text-primary">Demo {n + 1} / {tour.steps.length}</span>
          {step.tag && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">{step.tag}</span>}
        </span>
        <button onClick={() => endTour(tour.lang)} className="hover:text-foreground">Exit</button>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{step.title}</h2>
      <p className="mt-2 text-base leading-relaxed text-foreground/80 md:text-lg">{onPage ? step.text : "Opening the next page…"}</p>
      {onPage && step.evidence && (
        <p className="mt-3 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
          <span className="font-medium text-primary">Research: </span>
          {step.evidence}
        </p>
      )}
      {n === tour.steps.length - 1 && (
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          <a href={`/${tour.lang}/demo`} onClick={() => save(null)} className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90">
            Take a skill check
          </a>
          {(["candidate", "company", "city"] as const).map((r) => (
            <a key={r} href={`/${tour.lang}/login?as=${r}`} onClick={() => save(null)} className="rounded-lg border-2 border-primary px-3 py-2 text-center text-sm font-medium text-primary hover:bg-primary/5">
              {r === "candidate" ? "Aino, jobseeker" : r === "company" ? "Kauklahti Parcel" : "City of Espoo"}
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button disabled={n === 0} onClick={() => goToStep(tour, n - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Back</button>

        <button onClick={next} className="ml-auto rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground">
          {n >= tour.steps.length - 1 ? "Close" : onPage ? "Next" : "Open"}
        </button>
      </div>
    </div>
  );
}
