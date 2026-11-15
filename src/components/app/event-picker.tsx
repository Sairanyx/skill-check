"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { proofType } from "@/lib/proofs";

type Job = { id: string; title: string; summary: string; level: string; languages: { language: string; level: string }[]; proofs: { code: string; required: boolean }[] };
export type EventCompany = { id: string; name: string; sector: string; about: string; mode: "required" | "optional" | "off"; jobs: Job[] };

const LANG: Record<string, string> = { fi: "Finnish", sv: "Swedish", en: "English" };
const MODE = { required: "Skill check needed to meet them", optional: "Skill check optional, it helps you stand out", off: "No skill check needed, just come" } as const;
const MAX_PER_VISIT = 3;

/** Pick companies, see what each asks for, then book exactly those skill checks. */
export function EventPicker({ lang, companies }: { lang: string; companies: EventCompany[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  if (!companies.length) return <p className="text-sm text-muted-foreground">No companies have confirmed this event yet. Check again later.</p>;

  const allJobs = companies.flatMap((c) => c.jobs.map((j) => ({ ...j, company: c })));
  const chosen = allJobs.filter((j) => picked.includes(j.id));
  const toCheck = chosen.filter((j) => j.company.mode !== "off");
  const justCome = [...new Set(chosen.filter((j) => j.company.mode === "off").map((j) => j.company.name))];
  const proofsNeeded = [...new Set(chosen.flatMap((j) => j.proofs.filter((p) => p.required).map((p) => proofType(p.code)?.label.en ?? p.code)))];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {companies.map((c) => (
          <section key={c.id} className="rounded-lg border bg-background p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="text-xs text-muted-foreground">{c.sector}</span>
            </div>
            {c.about && <p className="mt-1 text-sm text-muted-foreground">{c.about}</p>}
            <p className={`mt-2 text-sm font-medium ${c.mode === "required" ? "text-primary" : "text-muted-foreground"}`}>{MODE[c.mode]}</p>
            <ul className="mt-3 space-y-3">
              {c.jobs.map((j) => (
                <li key={j.id}>
                  <label className="flex cursor-pointer gap-3">
                    <input type="checkbox" className="mt-1 size-4 accent-primary" checked={picked.includes(j.id)} onChange={() => toggle(j.id)} />
                    <span className="text-sm">
                      <span className="font-medium">{j.title}</span>
                      <span className="block text-muted-foreground">{j.summary}</span>
                      {(j.languages.length > 0 || j.proofs.length > 0) && (
                        <span className="mt-1 flex flex-wrap gap-2">
                          {j.languages.map((l) => (
                            <span key={l.language} className="rounded-full border px-2 py-0.5 text-xs">{LANG[l.language] ?? l.language} {l.level}</span>
                          ))}
                          {j.proofs.map((p) => (
                            <span key={p.code} className="rounded-full border px-2 py-0.5 text-xs">{proofType(p.code)?.label.en ?? p.code}{p.required ? "" : " (nice to have)"}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="h-fit space-y-4 rounded-lg border p-5 lg:sticky lg:top-6">
        <h2 className="font-semibold">Your plan</h2>
        {!chosen.length ? (
          <p className="text-sm text-muted-foreground">Tick the jobs that interest you.</p>
        ) : (
          <>
            {toCheck.length > 0 && (
              <div className="text-sm">
                <p className="font-medium">Skill checks to take ({toCheck.length})</p>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {toCheck.map((j) => (
                    <li key={j.id}>{j.company.name}: {j.title}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">One visit to an EXAM room, 30 minutes, up to {MAX_PER_VISIT} checks. Accepted results become badges on your event card and meetings at the event.</p>
              </div>
            )}
            {justCome.length > 0 && <p className="text-sm"><span className="font-medium">Just come and talk:</span> <span className="text-muted-foreground">{justCome.join(", ")}</span></p>}
            {proofsNeeded.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Documents City staff must check before you can book:</span> <span className="text-muted-foreground">{proofsNeeded.join(", ")}</span>{" "}
                <Link href={`/${lang}/candidate/proofs`} className="text-primary underline">Add proofs</Link>
              </p>
            )}
            {toCheck.length > MAX_PER_VISIT && <p className="text-sm text-muted-foreground">That is more than one visit. Book the first {MAX_PER_VISIT} now, the rest afterwards.</p>}
            {toCheck.length > 0 && (
              <Link href={`/${lang}/candidate/book?needs=${toCheck.slice(0, MAX_PER_VISIT).map((j) => j.id).join(",")}`} className={buttonVariants({ size: "lg", className: "w-full" })}>
                Book {toCheck.length > 1 ? "these skill checks" : "this skill check"}
              </Link>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
