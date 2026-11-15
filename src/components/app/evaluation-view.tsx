// Evidence view used by candidates (own result), companies and the City. Same facts for everyone.
import { Redacted } from "./redacted";

export type EvaluationData = {
  match: number;
  level: string;
  confidence: number;
  rubric: unknown;
  strengths: string[];
  gaps: string[];
  fairnessFlags?: string[];
  fairnessNote?: string | null;
  fairness?: { flags: string[]; note: string };
  model: string;
  languageAssessment?: LanguageResult[] | null;
  language?: LanguageResult[];
  /** Set when the interview panel (three Gemini 4 models) wrote the report. */
  method?: { engine?: string; summary?: string; suggested_conversation?: string; verdicts?: { panelist: string; is_person_good: boolean; how_good_or_bad: number; reasoning: string }[] } | null;
};
/** What each panel member looks at (panel/src/prompt.rs). */
const LENS: Record<string, string> = { Hydrogen: "Lead interviewer · job knowledge", Argon: "Problem solving", Carbon: "Authenticity" };
type LanguageResult = { language: string; required: string; assessed: string | null; meets: boolean; score: number; evidence: string[]; reason: string };
const LANGUAGE_NAMES: Record<string, string> = { fi: "Finnish", sv: "Swedish", en: "English" };

export type ProofStatus = { code: string; label: string; required: boolean; level?: string; status: "verified" | "declared" | "missing" };
const PROOF_STATUS = { verified: "Verified by the City", declared: "Not checked yet", missing: "Missing" } as const;

export type SkillAnchor = { skill: string; anchors: { "1": string; "3": string; "5": string } };

export function EvaluationView({ e, audience, proofs = [], anchors = [] }: { e: EvaluationData; audience: "candidate" | "reviewer"; proofs?: ProofStatus[]; anchors?: SkillAnchor[] }) {
  const strong = (skill: string) => anchors.find((a) => a.skill.toLowerCase() === skill.toLowerCase())?.anchors["5"];
  const rubric = (e.rubric ?? []) as { criterion: string; score: number; evidence: string[]; reason?: string }[];
  const flags = e.fairnessFlags ?? e.fairness?.flags ?? [];
  const note = e.fairnessNote ?? e.fairness?.note ?? "";
  const languages = e.languageAssessment ?? e.language ?? [];
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-12">
        <Stat label="Match" value={`${e.match}/10`} />
        <Stat label="Level" value={e.level} />
        <Stat label="Confidence" value={`${Math.round(e.confidence * 100)}%`} />
      </div>

      {e.method?.summary && <p className="max-w-3xl text-lg leading-relaxed">{e.method.summary}</p>}

      {!!e.method?.verdicts?.length && (
        <section>
          <h2 className="font-semibold">Panel verdicts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Three Gemini 4 models judge on their own. Their agreement is the confidence. Low agreement sends the result to City staff.</p>
          <div className="mt-4 grid items-start gap-3 md:grid-cols-3">
            {e.method.verdicts.map((v) => (
              <div key={v.panelist} className="rounded-lg bg-navy p-4 text-primary-foreground">
                <p className="text-xs text-primary-foreground/70">{LENS[v.panelist] ?? "Panel member"}</p>
                <p className="mt-1 font-heading text-lg font-bold text-tint">Gemini 4 {v.panelist}: {v.how_good_or_bad}/10</p>
                <p title={v.reasoning} className="mt-2 line-clamp-5 text-sm leading-relaxed text-primary-foreground/90">{v.reasoning}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {audience === "reviewer" && e.method?.suggested_conversation && (
        <section className="rounded-lg bg-tint/60 p-4">
          <h2 className="font-semibold text-primary">For the 15-minute meeting</h2>
          <p className="mt-1 text-sm">{e.method.suggested_conversation}</p>
        </section>
      )}

      {rubric.length > 0 && (
        <section>
          <h2 className="font-semibold">Feedback per skill</h2>
          <div className="mt-4 space-y-5">
            {rubric.map((r) => (
              <div key={r.criterion}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{r.criterion}</span>
                  <span className="text-muted-foreground">{r.evidence.length ? `${r.score}/10` : "not shown"}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted">
                  <div className="h-1 rounded-full bg-primary" style={{ width: `${r.score * 10}%` }} />
                </div>
                <dl className="mt-2 space-y-2 text-sm">
                  {strong(r.criterion) && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">What a strong answer shows</dt>
                      <dd>{strong(r.criterion)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{audience === "candidate" ? "From your answers" : "From the answers"}</dt>
                    {r.evidence.length ? (
                      r.evidence.map((q) => (
                        <dd key={q} className="italic text-muted-foreground">“<Redacted text={q} />”</dd>
                      ))
                    ) : (
                      <dd className="text-muted-foreground">Not shown in the answers. Lowers confidence, not the score.</dd>
                    )}
                  </div>
                  {r.evidence.length > 0 && r.reason && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Feedback</dt>
                      <dd>{r.reason}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      {proofs.length > 0 && (
        <section>
          <h2 className="font-semibold">Official proofs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Checked in person by City staff. The document itself is never shared.</p>
          <ul className="mt-4 divide-y border-y text-sm">
            {proofs.map((p) => (
              <li key={p.code} className="flex justify-between gap-6 py-3">
                <span>
                  {p.label}
                  {p.level ? `, ${p.level}` : ""}
                  <span className="ml-2 text-muted-foreground">{p.required ? "required" : "optional"}</span>
                </span>
                <span className={p.status === "verified" ? "text-primary" : p.status === "missing" && p.required ? "text-destructive" : "text-muted-foreground"}>{PROOF_STATUS[p.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {languages.length > 0 && (
        <section>
          <h2 className="font-semibold">Language for this job</h2>
          <p className="mt-1 text-sm text-muted-foreground">Required by the company. Scored separately, not part of the match.</p>
          <div className="mt-4 space-y-5">
            {languages.map((l) => (
              <div key={l.language}>
                <div className="flex justify-between text-sm">
                  <span>{LANGUAGE_NAMES[l.language] ?? l.language}, {l.required} required</span>
                  <span className={l.meets ? "text-primary" : "text-muted-foreground"}>
                    {l.assessed ? `${l.assessed}, ${l.meets ? "meets" : "below"}` : "not assessed"}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted">
                  <div className="h-1 rounded-full bg-primary" style={{ width: `${l.score * 10}%` }} />
                </div>
                {l.evidence.map((q) => (
                  <p key={q} className="mt-1 text-sm text-muted-foreground">“{q}”</p>
                ))}
                <p className="mt-1 text-xs text-muted-foreground">{l.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 md:grid-cols-2">
        <List title="Strengths" items={e.strengths} />
        <List title={audience === "candidate" ? "To show next time" : "Not shown yet"} items={e.gaps} />
      </section>

      <p className="text-xs text-muted-foreground">
        {flags.length ? `Fairness check flagged: ${flags.join(", ")}. ` : `Fairness check: ${note} `}
        Scored by {e.model} on pseudonymised answers against written anchors for each skill. Quotes are checked against the real answers. Evidence for a human decision, not a decision.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold capitalize text-primary">{value}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
