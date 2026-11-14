import "server-only";
import { think, type ChatMessage } from "./llm";
import type { Need } from "@/lib/demo-data";
import type { Difficulty } from "@/db/schema";
import { localeNames, type Locale } from "@/i18n/config";

export const MAX_TURNS = 6;

/** answer = pseudonymised text only. difficulty = how hard that question was. */
export type Turn = { question: string; answer: string; difficulty?: Difficulty };
export type NextQuestion = { question: string; difficulty: Difficulty };

const LEVELS: Difficulty[] = ["low", "medium", "high"];

/**
 * Adaptive interviewer.
 * - With a company question bank: start at medium, may go up to high, uses the company's questions as starting points.
 * - Without one: easy filter mode. Start low, at most medium. Questions are slightly below average, built from the
 *   company description, so only clearly weak answers fall short.
 */
function plan(need: Need) {
  const bank = need.questionBank?.[need.level]?.filter(Boolean) ?? [];
  return bank.length
    ? { mode: "company" as const, start: "medium" as Difficulty, ceiling: "high" as Difficulty, bank }
    : { mode: "filter" as const, start: "low" as Difficulty, ceiling: "medium" as Difficulty, bank: [] };
}

function system(need: Need, lang: Locale) {
  const p = plan(need);
  return `You are a friendly, professional interviewer running a short skill check at a City of Espoo testing room.
Company: ${need.company}.${need.companyDescription ? ` About the company: ${need.companyDescription}` : ""}
Need: "${need.title}". ${need.summary}
Key skills: ${need.skills.join(", ")}. Target level: ${need.level}.

${
  p.mode === "company"
    ? `The company prepared these questions for this level. Use them as starting points, in your own words, and follow up on the answers:\n${p.bank.map((q) => `- ${q}`).join("\n")}`
    : `The company did not prepare questions. Ask practical, slightly-below-average, easy questions about this kind of work. The goal is only to filter out clearly weak answers, not to find experts.`
}

Difficulty:
- Every question has a difficulty: "low", "medium" or "high". Start at "${p.start}". Never go above "${p.ceiling}".
- After a specific, well-reasoned answer, go one level up. After a vague or wrong answer, go one level down. Never jump two levels.

Rules:
- Speak ${localeNames[lang]} only. Keep each question short (1–3 sentences).
- Ask HOW the candidate would solve realistic problems, and about real work they have done. Follow up on their previous answer.
- Never ask about age, origin, nationality, family, health, religion or anything unrelated to the job.
- Tags like [NAME] or [EMPLOYER] are privacy redactions. Never ask what they stand for.
- Never judge or score the candidate out loud. Be encouraging and neutral.`;
}

const SCHEMA = {
  type: "object",
  properties: { question: { type: "string" }, difficulty: { type: "string", enum: LEVELS } },
  required: ["question", "difficulty"],
};

export async function nextQuestion(need: Need, lang: Locale, turns: Turn[]): Promise<NextQuestion> {
  const messages: ChatMessage[] = [{ role: "system", content: system(need, lang) }];
  if (turns.length === 0) {
    messages.push({ role: "user", content: "(The candidate has sat down. Greet them in one short sentence and ask the first question.)" });
  }
  for (const t of turns) {
    messages.push({ role: "assistant", content: JSON.stringify({ question: t.question, difficulty: t.difficulty ?? plan(need).start }) });
    messages.push({ role: "user", content: t.answer });
  }
  const out = JSON.parse(await think(messages, { json: SCHEMA, maxTokens: 400 })) as NextQuestion;
  // Enforce the ceiling and the one-step rule in code, not only in the prompt.
  const p = plan(need);
  const prev = turns.at(-1)?.difficulty ?? p.start;
  let i = LEVELS.indexOf(out.difficulty);
  if (i < 0) i = LEVELS.indexOf(prev);
  i = Math.max(LEVELS.indexOf(prev) - 1, Math.min(LEVELS.indexOf(prev) + 1, i));
  if (turns.length === 0) i = LEVELS.indexOf(p.start);
  i = Math.min(i, LEVELS.indexOf(p.ceiling));
  return { question: out.question.trim(), difficulty: LEVELS[i] };
}

/** Highest difficulty the candidate was asked. */
export const difficultyReached = (turns: { difficulty?: Difficulty }[]): Difficulty =>
  LEVELS[Math.max(0, ...turns.map((t) => LEVELS.indexOf(t.difficulty ?? "low")))];
