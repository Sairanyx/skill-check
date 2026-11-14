// Evidence view used by candidates (own result), companies and the City. Same facts for everyone.
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
};
type LanguageResult = { language: string; required: string; assessed: string | null; meets: boolean; score: number; evidence: string[]; reason: string };
const LANGUAGE_NAMES: Record<string, string> = { fi: "Finnish", sv: "Swedish", en: "English" };

export type ProofStatus = { code: string; label: string; required: boolean; level?: string; status: "verified" | "declared" | "missing" };
const PROOF_STATUS = { verified: "Verified by the City", declared: "Not checked yet", missing: "Missing" } as const;

export function EvaluationView({ e, audience, proofs = [] }: { e: EvaluationData; audience: "candidate" | "reviewer"; proofs?: ProofStatus[] }) {
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

      {rubric.length > 0 && (
        <section>
          <h2 className="font-semibold">Evidence</h2>
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
                {r.evidence.length ? (
                  <>
                    {r.evidence.map((q) => (
                      <p key={q} className="mt-1 text-sm text-muted-foreground">“{q}”</p>
                    ))}
                    {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Not shown in the answers. Lowers confidence, not the score.</p>
                )}
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
