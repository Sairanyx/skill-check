/**
 * Pure rules with no database or AI, so they can be unit tested and read in one place.
 * Each one is used by a service (see the comment on each).
 */
export type Difficulty = "low" | "medium" | "high";
export const LEVELS: Difficulty[] = ["low", "medium", "high"];
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/** D11, services/decisions.ts: accepted = the company accepted, or the City accepted and the company did not decline. */
export const isAccepted = (companySays?: string, citySays?: string) => companySays === "invite" || (citySays === "invite" && companySays !== "not_now");

/** ai/interviewer.ts: the next difficulty moves at most one step, never above the ceiling, and the first question uses the start level. */
export function stepDifficulty(o: { proposed: string; previous: Difficulty; start: Difficulty; ceiling: Difficulty; first: boolean }): Difficulty {
  if (o.first) return LEVELS[Math.min(LEVELS.indexOf(o.start), LEVELS.indexOf(o.ceiling))];
  const prev = LEVELS.indexOf(o.previous);
  let i = LEVELS.indexOf(o.proposed as Difficulty);
  if (i < 0) i = prev;
  i = Math.max(prev - 1, Math.min(prev + 1, i));
  return LEVELS[Math.min(i, LEVELS.indexOf(o.ceiling))];
}

/** ai/evaluator.ts: median of the judges per skill (one outlier cannot move it). */
export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * ai/evaluator.ts: everything that can be computed, is computed (BARS, D8).
 * runs = one list of skill scores (0 to 5, 0 = not shown) per judge.
 */
export function computeScores(runs: { score: number }[][], difficulty: Difficulty) {
  const n = runs[0].length;
  const avg = runs[0].map((_, i) => median(runs.map((r) => r[i].score)));
  const shown = avg.filter((x) => x > 0);
  const coverage = shown.length / n;
  const disagreement = runs[0].reduce((s, _, i) => s + (Math.max(...runs.map((r) => r[i].score)) - Math.min(...runs.map((r) => r[i].score))), 0) / n;
  const agreement = 1 - disagreement / 5;
  // Match is over the skills the candidate showed. Skills not shown lower the CONFIDENCE, not the score.
  const mean = shown.length ? shown.reduce((a, b) => a + b, 0) / shown.length : 0;
  const match = Math.round((mean / 5) * 100) / 10; // 0 to 10
  const level: "junior" | "mid" | "senior" = mean >= 4 && difficulty === "high" ? "senior" : mean >= 2.5 ? "mid" : "junior";
  const confidence = Math.round((0.5 * coverage + 0.5 * agreement) * 100) / 100;
  return { avg, match, level, confidence, coverage: Math.round(coverage * 100) / 100, agreement: Math.round(agreement * 100) / 100 };
}

/** services/proofs.ts and the language check: is level a at least level b? */
export const cefrAtLeast = (a: string, b: string) => CEFR_LEVELS.indexOf(a as (typeof CEFR_LEVELS)[number]) >= CEFR_LEVELS.indexOf(b as (typeof CEFR_LEVELS)[number]) && CEFR_LEVELS.includes(a as (typeof CEFR_LEVELS)[number]);
