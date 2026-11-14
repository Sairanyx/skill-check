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

/** Height kept free above the guide bar, so the highlighted part is never under it. */
const BAR = 190;

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

/** The guide bar shown at the bottom of every page while the tour runs. */
export function TourGuide() {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const tour = useMemo<TourState | null>(() => (raw ? JSON.parse(raw) : null), [raw]);

  const lit = useRef<Element | null>(null);
  const step = tour?.steps[tour.step];
  const onPage = !!step && pathname === `/${tour!.lang}${step.path.split("?")[0]}`.replace(/\/$/, "");

  // Demo mode: short lists (see globals.css) and room under the page so its last part can scroll above the bar.
  useEffect(() => {
    document.documentElement.classList.toggle("tour-on", !!tour);
    document.body.style.paddingBottom = tour ? `${BAR}px` : "";
    return () => void (document.body.style.paddingBottom = "");
  }, [tour]);

  // Highlight the part of the page this step is about and bring it into view above the bar.
  useEffect(() => {
    lit.current?.classList.remove("tour-highlight");
    if (!onPage || !step?.highlight) return;
    // The page may still be streaming in: look for the part a few times before giving up.
    let tries = 0;
    const t = setInterval(() => {
      const el = document.querySelector(step.highlight!);
      if (!el && ++tries < 30) return;
      clearInterval(t);
      if (!el) return;
      el.classList.add("tour-highlight");
      lit.current = el;
      const r = el.getBoundingClientRect();
      const fits = r.top >= 16 && r.bottom <= window.innerHeight - BAR;
      if (!fits) window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 112), behavior: "smooth" });
    }, 200);
    return () => clearInterval(t);
  }, [onPage, step]);

  const next = useCallback(() => {
    if (!tour) return;
    if (tour.step >= tour.steps.length - 1) return void endTour(tour.lang);
    const n = tour.step + 1;
    // Same page, next part (e.g. conversation, then feedback): no reload needed.
    if (tour.steps[n].path === tour.steps[tour.step].path && tour.steps[n].as === tour.steps[tour.step].as) return save({ ...tour, step: n });
    goToStep(tour, n);
  }, [tour]);

  if (!tour || !step) return null;
  const n = tour.step;
  const last = n === tour.steps.length - 1;

  return (
    <div role="dialog" aria-label="Guided demo" className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-primary bg-background shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
      <div className="h-1 bg-tint">
        <div className="h-1 bg-primary transition-all" style={{ width: `${((n + 1) / tour.steps.length) * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:gap-10">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            {n + 1} / {tour.steps.length}
          </p>
          <h2 className="mt-1 font-heading text-2xl text-foreground md:text-3xl">{step.title}</h2>
          <p className="mt-1 text-base text-foreground/80 md:text-lg">{onPage ? step.text : "Opening the next page…"}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {last ? (
            <>
              <a href={`/${tour.lang}/demo`} onClick={() => save(null)} className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90">
                Take a skill check
              </a>
              {(["candidate", "company", "city"] as const).map((r) => (
                <a key={r} href={`/${tour.lang}/login?as=${r}`} onClick={() => save(null)} className="rounded-lg border-2 border-primary px-4 py-2 font-medium text-primary hover:bg-tint">
                  {r === "candidate" ? "Aino" : r === "company" ? "Company" : "City"}
                </a>
              ))}
              <button onClick={() => endTour(tour.lang)} className="px-3 py-2 text-muted-foreground hover:text-foreground">Close</button>
            </>
          ) : (
            <>
              <button onClick={() => endTour(tour.lang)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Exit</button>
              <button disabled={n === 0} onClick={() => goToStep(tour, n - 1)} className="rounded-lg border-2 px-5 py-2.5 font-medium disabled:opacity-40">Back</button>
              <button onClick={next} className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90">{onPage ? "Next" : "Open"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
