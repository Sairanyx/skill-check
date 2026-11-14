import "server-only";
import { computeScores } from "@/lib/rules";
import { thinkJsonRaw, modelLabel, judges, providerLabel, type Provider } from "./llm";
import { generateAnchors, type SkillAnchors } from "./rubric";
import type { Need } from "@/lib/demo-data";
import type { Turn } from "./interviewer";
import { CEFR, type Cefr, type Difficulty, type LanguageResult } from "@/db/schema";
import { languageNamesEn as localeNames } from "@/i18n/config";

/**
 * Evaluator (agent 2) + fairness auditor (agent 3), BARS style:
 *   1. evidence first: exact quotes per skill, verified in code against the real answers
 *   2. score each skill against its written anchors (1–5, 0 = not shown), two independent runs
 *   3. match, level and confidence are COMPUTED IN CODE, not guessed by the model
 *   4. fairness auditor checks only for bias (language, fluency, background), not answer quality
 *   5. a language requirement (if the company set one) is assessed SEPARATELY on the CEFR scale,
 *      never mixed into the skill match, so fluency stays out of every other score
 */
export type SkillResult = { criterion: string; score: number; evidence: string[]; reason: string; checklist: string[] };
export type Evaluation = {
  match: number; // 0–10, computed
  level: "junior" | "mid" | "senior"; // computed
  confidence: number; // 0–1, computed from evidence coverage + agreement between runs
  rubric: SkillResult[]; // score shown 0–10 per skill
  strengths: string[];
  gaps: string[];
  fairness: { flags: string[]; note: string };
  model: string;
  method: { coverage: number; agreement: number; runs: number[][]; judges: { judge: string; label: string; ok: boolean }[] };
  language: LanguageResult[]; // separate from match: only when the job has a language requirement
};

const answersOnly = (turns: Turn[]) => turns.map((t) => t.answer).join("\n");
const transcript = (turns: Turn[]) =>
  turns.map((t, i) => `Q${i + 1} (${t.difficulty ?? "medium"} difficulty): ${t.question}\nA${i + 1}: ${t.answer}`).join("\n\n");
const norm = (s: string) => s.toLowerCase().replace(/[“”"'.,!?;:()]/g, "").replace(/\s+/g, " ").trim();

/** Step 1: quotes per skill. Any quote that is not really in the answers is thrown away. */
async function extractEvidence(anchors: SkillAnchors[], turns: Turn[]) {
  const raw = await thinkJsonRaw(
    [
      {
        role: "system",
        content: `For each skill, copy the parts of the candidate's ANSWERS (lines starting with A) that show this skill.
Copy them EXACTLY, word for word, short (max 25 words each), in the SAME LANGUAGE as the answer. Never translate (a Finnish or Swedish answer gives a Finnish or Swedish quote). Do not paraphrase. If nothing shows the skill, return an empty list.
Ignore grammar and language quality.`,
      },
      { role: "user", content: `Skills: ${anchors.map((a) => a.skill).join("; ")}\n\n${transcript(turns)}` },
    ],
    {
      json: {
        type: "object",
        properties: {
          skills: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, quotes: { type: "array", items: { type: "string" } } }, required: ["skill", "quotes"] } },
        },
        required: ["skills"],
      },
      maxTokens: 1500,
      temperature: 0,
    },
  );
  const found = (JSON.parse(raw) as { skills: { skill: string; quotes: string[] }[] }).skills;
  const haystack = norm(answersOnly(turns));
  return anchors.map((a) => {
    const quotes = found.find((f) => f.skill.toLowerCase() === a.skill.toLowerCase())?.quotes ?? [];
    return { skill: a.skill, quotes: quotes.filter((q) => q.trim() && haystack.includes(norm(q))) }; // verified, never invented
  });
}

/** Step 2: score every skill against its anchors, using only the verified quotes. */
async function scoreRun(anchors: SkillAnchors[], evidence: { skill: string; quotes: string[] }[], temperature: number, provider?: Provider) {
  const raw = await thinkJsonRaw(
    [
      {
        role: "system",
        content: `Score each skill 1–5 against its anchors, using ONLY the quoted evidence. 0 = no evidence.
Pick the anchor the evidence matches best (2 and 4 are in between). List which checklist items the evidence shows.
Give a one-sentence reason that refers to the evidence. Never consider grammar, fluency, accent or language choice.`,
      },
      {
        role: "user",
        content: anchors
          .map((a) => {
            const q = evidence.find((e) => e.skill === a.skill)?.quotes ?? [];
            return `SKILL: ${a.skill}\n1 = ${a.anchors["1"]}\n3 = ${a.anchors["3"]}\n5 = ${a.anchors["5"]}\nChecklist: ${a.checklist.join(" | ")}\nEvidence: ${q.length ? q.map((x) => `"${x}"`).join(" ") : "(none)"}`;
          })
          .join("\n\n"),
      },
    ],
    {
      json: {
        type: "object",
        properties: {
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: { skill: { type: "string" }, score: { type: "integer", minimum: 0, maximum: 5 }, checklist: { type: "array", items: { type: "string" } }, reason: { type: "string" } },
              required: ["skill", "score", "checklist", "reason"],
            },
          },
        },
        required: ["skills"],
      },
      maxTokens: 1500,
      temperature,
      provider,
    },
  );
  const out = (JSON.parse(raw) as { skills: { skill: string; score: number; checklist: string[]; reason: string }[] }).skills;
  return anchors.map((a) => {
    const r = out.find((o) => o.skill.toLowerCase() === a.skill.toLowerCase());
    const hasEvidence = (evidence.find((e) => e.skill === a.skill)?.quotes.length ?? 0) > 0;
    if (!hasEvidence) return { skill: a.skill, score: 0, checklist: [], reason: "" };
    // Blend the anchor level with the yes/no checklist (small yes/no judgements are more reliable for LLMs).
    const anchor = Math.max(1, Math.min(5, r?.score ?? 1));
    const hits = (r?.checklist ?? []).filter((c) => a.checklist.some((x) => norm(x) === norm(c) || norm(x).includes(norm(c)) || norm(c).includes(norm(x)))).length;
    const fromChecklist = a.checklist.length ? 1 + (4 * Math.min(hits, a.checklist.length)) / a.checklist.length : anchor;
    return { skill: a.skill, score: Math.round(((anchor + fromChecklist) / 2) * 2) / 2, checklist: r?.checklist ?? [], reason: r?.reason ?? "" };
  });
}



/**
 * Step 2b: the panel. Several judges from different companies score the same verified evidence
 * (a "panel of LLM evaluators": less bias than one judge, Verga et al. 2024). A judge that fails is
 * left out and recorded. With one judge we fall back to two runs of the same model.
 */
async function scorePanel(anchors: SkillAnchors[], evidence: { skill: string; quotes: string[] }[]) {
  const panel = judges();
  if (panel.length < 2) {
    const runs = await Promise.all([scoreRun(anchors, evidence, 0), scoreRun(anchors, evidence, 0.7)]);
    return { runs, judges: [{ judge: panel[0] ?? "gemma", label: providerLabel(panel[0] ?? "gemma"), ok: true }] };
  }
  const settled = await Promise.allSettled(panel.map((j) => scoreRun(anchors, evidence, 0, j)));
  const runs = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  settled.forEach((r, i) => r.status === "rejected" && console.error(JSON.stringify({ event: "ai.judge_failed", judge: panel[i], error: String(r.reason).slice(0, 200) })));
  if (!runs.length) throw new Error("No judge on the panel could score this check");
  // Only one judge answered: add a second run of it, so agreement is measured and not assumed.
  if (runs.length === 1) runs.push(await scoreRun(anchors, evidence, 0.7, panel[settled.findIndex((r) => r.status === "fulfilled")]));
  return { runs, judges: panel.map((j, i) => ({ judge: j, label: providerLabel(j), ok: settled[i].status === "fulfilled" })) };
}


/**
 * Language for this job: only when the need says e.g. "Swedish B2". The model quotes sentences
 * written in that language (verified in code) and estimates a CEFR level for written/spoken production.
 * Meets = assessed level ≥ required level. No answer in that language → not assessed, never guessed.
 */
export async function assessLanguages(need: Need, turns: Turn[]): Promise<LanguageResult[]> {
  const reqs = need.languageRequirements ?? [];
  if (!reqs.length) return [];
  const haystack = norm(answersOnly(turns));
  return Promise.all(
    reqs.map(async (r): Promise<LanguageResult> => {
      const name = localeNames[r.language];
      try {
        const raw = await thinkJsonRaw(
          [
            {
              role: "system",
              content: `You assess ONE thing: how well a job candidate communicates in ${name}, on the CEFR scale (A1 to C2), for a job that requires ${name} ${r.level}.
Use only the candidate's answers that are written in ${name}. Copy up to 3 sentences in ${name} EXACTLY as written. Judge whether the meaning is clear and appropriate for work: range, accuracy, coherence. Placeholders like [NAME] or [PLACE] are privacy tags, ignore them.
Give level as one of A1, A2, B1, B2, C1, C2. If no answer is in ${name}, return an empty quotes list and level "none".`,
            },
            { role: "user", content: `ANSWERS:\n${answersOnly(turns)}` },
          ],
          {
            json: {
              type: "object",
              properties: { quotes: { type: "array", items: { type: "string" } }, reason: { type: "string" }, level: { type: "string" } },
              required: ["quotes", "reason", "level"],
            },
            maxTokens: 600,
            temperature: 0,
          },
        );
        const out = JSON.parse(raw) as { quotes: string[]; level: string; reason: string };
        const evidence = out.quotes.filter((q) => q.trim() && haystack.includes(norm(q))); // verified
        const level = out.level.trim().toUpperCase().slice(0, 2);
        const assessed = evidence.length && (CEFR as readonly string[]).includes(level) ? (level as Cefr) : null;
        const meets = assessed !== null && CEFR.indexOf(assessed) >= CEFR.indexOf(r.level);
        const score = assessed ? Math.round(((CEFR.indexOf(assessed) + 1) / CEFR.length) * 100) / 10 : 0; // A1 1.7 … C2 10
        return { language: r.language, required: r.level, assessed, meets, score, evidence, reason: assessed ? out.reason : `No answer in ${name} to assess.` };
      } catch {
        return { language: r.language, required: r.level, assessed: null, meets: false, score: 0, evidence: [], reason: "The automatic language assessment could not run. A City reviewer checks it." };
      }
    }),
  );
}

export async function evaluate(need: Need, turns: Turn[]): Promise<Evaluation> {
  const anchors = need.anchors?.length ? need.anchors : await generateAnchors(need);
  const evidence = await extractEvidence(anchors, turns);
  const [panel, language] = await Promise.all([scorePanel(anchors, evidence), assessLanguages(need, turns)]);
  const runs = panel.runs;
  const difficulty: Difficulty = turns.some((t) => t.difficulty === "high") ? "high" : turns.some((t) => t.difficulty === "medium") ? "medium" : "low";
  const c = computeScores(runs, difficulty);

  const rubric: SkillResult[] = anchors.map((a, i) => ({
    criterion: a.skill,
    score: Math.round(c.avg[i] * 2 * 10) / 10, // shown on a 0–10 bar
    evidence: evidence[i].quotes,
    reason: runs[0][i].reason,
    checklist: runs[0][i].checklist,
  }));
  const strengths = rubric.filter((r) => r.score >= 8).map((r) => `${r.criterion}: ${r.reason}`);
  const gaps = rubric.filter((r) => r.score <= 4).map((r) => (r.evidence.length ? `${r.criterion}: ${r.reason}` : `${r.criterion}: not shown in the answers yet`));

  // If the automatic fairness check cannot run, a human looks at it instead (flag → City review queue).
  let fairness: { flags: string[]; note: string };
  try {
    const fairnessRaw = await thinkJsonRaw(
      [
        {
          role: "system",
          content: `You audit an AI evaluation of a job candidate ONLY for bias. Flag a problem only if a score or reason depends on grammar, fluency, accent, writing style, language choice, nationality, age, gender, education prestige, career gaps or anything unrelated to the job.
  Do NOT flag weak or missing evidence: that is not bias.${language.length ? ` This job has a stated language requirement (${language.map((l) => `${localeNames[l.language as "fi" | "sv" | "en"]} ${l.required}`).join(", ")}). It is assessed separately and is legitimate, so do not flag the separate language assessment, but DO flag if language quality affected the skill scores below.` : ""} Return flags (empty if none) and a one-sentence note.`,
        },
        { role: "user", content: `TRANSCRIPT:\n${transcript(turns)}\n\nSCORES AND REASONS:\n${rubric.map((r) => `${r.criterion}: ${r.score}/10, ${r.reason}`).join("\n")}` },
      ],
      { json: { type: "object", properties: { flags: { type: "array", items: { type: "string" } }, note: { type: "string" } }, required: ["flags", "note"] }, maxTokens: 800, temperature: 0 },
    );
    fairness = JSON.parse(fairnessRaw);
  } catch {
    fairness = { flags: ["automatic fairness check could not run"], note: "Sent to a City reviewer because the automatic fairness check failed." };
  }

  return {
    match: c.match,
    level: c.level,
    confidence: c.confidence,
    rubric,
    strengths,
    gaps,
    fairness,
    model: modelLabel(),
    method: { coverage: c.coverage, agreement: c.agreement, runs: runs.map((r) => r.map((x) => x.score)), judges: panel.judges },
    language,
  };
}
