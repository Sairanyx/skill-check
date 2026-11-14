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
    <div className="mt-10 space-y-6">
      <button onClick={() => start("watch")} className="w-full rounded-2xl bg-primary p-6 text-left text-primary-foreground transition-opacity hover:opacity-90 md:p-8">
        <span className="text-2xl font-semibold">Start the demo</span>
        <span className="mt-2 block opacity-90">The City, a company and a jobseeker, in 12 short steps. Click Next when you are ready.</span>
      </button>
      <div>
        <p className="text-sm text-muted-foreground">Or log in straight away (demo accounts are filled in):</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(["candidate", "company", "city"] as const).map((r) => (
            <a key={r} href={`/${lang}/login?as=${r}`} className="rounded-lg border-2 border-primary px-3 py-2 text-center font-medium text-primary hover:bg-primary/5">
              {r === "candidate" ? "Aino, jobseeker" : r === "company" ? "Kauklahti Parcel" : "City of Espoo"}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
