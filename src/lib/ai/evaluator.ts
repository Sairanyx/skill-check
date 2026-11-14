import "server-only";
import { think, modelLabel } from "./llm";
import type { Need } from "@/lib/demo-data";
import type { Turn } from "./interviewer";

export type Evaluation = {
  match: number; // 0–10
  level: "junior" | "mid" | "senior";
  confidence: number; // 0–1
  rubric: { criterion: string; score: number; evidence: string[] }[];
  strengths: string[];
  gaps: string[];
  fairness: { flags: string[]; note: string };
  model: string;
};

const EVAL_SCHEMA = {
  type: "object",
  properties: {
    match: { type: "number", minimum: 0, maximum: 10 },
    level: { type: "string", enum: ["junior", "mid", "senior"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    rubric: {
      type: "array",
      items: {
        type: "object",
        properties: {
          criterion: { type: "string" },
          score: { type: "number", minimum: 0, maximum: 10 },
          evidence: { type: "array", items: { type: "string" } },
        },
        required: ["criterion", "score", "evidence"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
  },
  required: ["match", "level", "confidence", "rubric", "strengths", "gaps"],
};

const FAIRNESS_SCHEMA = {
  type: "object",
  properties: { flags: { type: "array", items: { type: "string" } }, note: { type: "string" } },
  required: ["flags", "note"],
};

const transcript = (turns: Turn[]) =>
  turns.map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`).join("\n\n");

export async function evaluate(need: Need, turns: Turn[]): Promise<Evaluation> {
  const raw = await think(
    [
      {
        role: "system",
        content: `You assess a pseudonymised skill-check transcript for the need "${need.title}" (${need.company}).
Skills: ${need.skills.join(", ")}. Target level: ${need.level}.
Score ONLY reasoning, problem-solving and relevant knowledge shown in the answers. Ignore grammar, fluency, accent, language choice and writing style completely.
Use the key skills as rubric criteria. For each, quote short exact phrases from the answers as evidence (in the original language).
"match" = how well the candidate fits this need (0–10). "confidence" = how sure you are given the amount of evidence (short or vague answers → low confidence).
You give evidence to help a human decide. You do not decide.`,
      },
      { role: "user", content: transcript(turns) },
    ],
    { json: EVAL_SCHEMA, maxTokens: 1500 },
  );
  const evaluation = JSON.parse(raw) as Omit<Evaluation, "fairness" | "model">;

  const fairnessRaw = await think(
    [
      {
        role: "system",
        content: `You audit an AI evaluation of a job candidate for bias. Check whether the scores or wording rely on language fluency, grammar, accent, style, nationality, education prestige, career gaps or anything unrelated to the job, and whether the evidence actually supports the scores.
Return flags (short phrases, empty if none) and a one-sentence note.`,
      },
      { role: "user", content: `TRANSCRIPT:\n${transcript(turns)}\n\nEVALUATION:\n${raw}` },
    ],
    { json: FAIRNESS_SCHEMA, maxTokens: 400 },
  );

  return { ...evaluation, fairness: JSON.parse(fairnessRaw), model: modelLabel() };
}
