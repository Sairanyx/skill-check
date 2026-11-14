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
};

export function EvaluationView({ e, audience }: { e: EvaluationData; audience: "candidate" | "reviewer" }) {
  const rubric = (e.rubric ?? []) as { criterion: string; score: number; evidence: string[] }[];
  const flags = e.fairnessFlags ?? e.fairness?.flags ?? [];
  const note = e.fairnessNote ?? e.fairness?.note ?? "";
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
                  <span className="text-muted-foreground">{r.score}/10</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted">
                  <div className="h-1 rounded-full bg-primary" style={{ width: `${r.score * 10}%` }} />
                </div>
                {r.evidence.map((q) => (
                  <p key={q} className="mt-1 text-sm text-muted-foreground">“{q}”</p>
                ))}
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
        Scored by {e.model} on pseudonymised answers. Evidence for a human decision, not a decision.
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
