"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  // A full load on purpose: the new login must apply to the whole page.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/${s.lang}${step.path}`;
}

/** The floating guide shown on every page while the tour runs. */
export function TourGuide() {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const tour = useMemo<TourState | null>(() => (raw ? JSON.parse(raw) : null), [raw]);
  const setTour = (t: TourState | null) => save(t);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const lit = useRef<Element | null>(null);
  const step = tour?.steps[tour.step];
  const onPage = !!step && pathname === `/${tour!.lang}${step.path.split("?")[0]}`.replace(/\/$/, "");

  // Highlight and scroll to the part of the page this step is about.
  useEffect(() => {
    lit.current?.classList.remove("tour-highlight");
    if (!onPage || !step?.highlight) return;
    const t = setTimeout(() => {
      const el = document.querySelector(step.highlight!);
      if (!el) return;
      el.classList.add("tour-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      lit.current = el;
    }, 400);
    return () => clearTimeout(t);
  }, [onPage, step]);

  const next = useCallback(() => {
    if (!tour) return;
    if (tour.step >= tour.steps.length - 1) return save(null);
    const s = { ...tour };
    const n = tour.step + 1;
    // Same page, next part (e.g. conversation, then feedback): no reload needed.
    if (tour.steps[n].path === tour.steps[tour.step].path && tour.steps[n].as === tour.steps[tour.step].as) {
      save({ ...s, step: n });
      return;
    }
    goToStep({ ...s, step: tour.step }, n);
  }, [tour]);

  // Watch mode: move on by itself.
  useEffect(() => {
    if (!tour || tour.mode !== "watch" || paused || !onPage) return;
    const total = (step?.seconds ?? 10) * 1000;
    const start = Date.now();
    const id = setInterval(() => {
      const f = Math.min(1, (Date.now() - start) / total);
      setElapsed(f);
      if (f >= 1) {
        clearInterval(id);
        setElapsed(0);
        next();
      }
    }, 100);
    return () => clearInterval(id);
  }, [tour, paused, onPage, step, next]);

  if (!tour || !step) return null;
  const n = tour.step;

  return (
    <div role="dialog" aria-label="Guided demo" className="fixed bottom-4 right-4 z-50 w-[min(92vw,380px)] rounded-xl border bg-background p-5 shadow-2xl">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide text-primary">Guided demo · {n + 1} of {tour.steps.length}</span>
        <button onClick={() => setTour(null)} className="hover:text-foreground">Exit</button>
      </div>
      <h2 className="mt-2 text-lg font-semibold">{step.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{onPage ? step.text : "Opening the next page…"}</p>
      {tour.mode === "watch" && (
        <div className="mt-4 h-1 rounded-full bg-muted">
          <div className="h-1 rounded-full bg-primary transition-[width] duration-100" style={{ width: `${elapsed * 100}%` }} />
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button disabled={n === 0} onClick={() => goToStep(tour, n - 1)} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40">Back</button>
        {tour.mode === "watch" && (
          <button onClick={() => setPaused((p) => !p)} className="rounded-md border px-3 py-1.5 text-sm">{paused ? "Play" : "Pause"}</button>
        )}
        <button onClick={next} className="ml-auto rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
          {n >= tour.steps.length - 1 ? "Finish" : onPage ? "Next" : "Open"}
        </button>
      </div>
    </div>
  );
}
