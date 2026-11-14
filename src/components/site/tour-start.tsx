"use client";

import { STORY, type TourState } from "./tour";
import { goToStep } from "./tour-guide";

/** The two ways to start the demo. Ids for this database are filled into the story here. */
export function TourStart({ lang, ids }: { lang: string; ids: { event: string; check: string; need: string } }) {
  const start = (mode: TourState["mode"]) => {
    const steps = STORY.map((s) => ({ ...s, path: s.path.replace(":event", ids.event).replace(":check", ids.check).replace(":need", ids.need) }));
    goToStep({ mode, step: 0, steps, lang }, 0);
  };
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <button onClick={() => start("watch")} className="rounded-xl border-2 border-primary p-6 text-left transition-colors hover:bg-primary/5">
        <span className="text-lg font-semibold text-primary">Watch the story</span>
        <span className="mt-2 block text-sm text-muted-foreground">About 3 minutes. The demo moves by itself and explains each step. Pause any time.</span>
      </button>
      <button onClick={() => start("try")} className="rounded-xl border p-6 text-left transition-colors hover:bg-muted">
        <span className="text-lg font-semibold">Try it yourself</span>
        <span className="mt-2 block text-sm text-muted-foreground">Same steps, at your own pace. Click around as Aino, the company and the City.</span>
      </button>
    </div>
  );
}
