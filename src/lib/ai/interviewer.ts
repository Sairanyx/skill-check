import "server-only";
import { think, type ChatMessage } from "./llm";
import type { Need } from "@/lib/demo-data";
import { localeNames, type Locale } from "@/i18n/config";

export const MAX_TURNS = 6;

export type Turn = { question: string; answer: string }; // answer = pseudonymised text only

function system(need: Need, lang: Locale) {
  return `You are a friendly, professional interviewer running a short skill check for the City of Espoo's recruitment event.
Company need: "${need.title}" at ${need.company}.
What they need: ${need.summary}
Key skills: ${need.skills.join(", ")}. Target level: ${need.level}.

Rules:
- Speak ${localeNames[lang]} only. Keep each question short (1–3 sentences).
- Ask about HOW the candidate would solve realistic problems from this need, and about real work they have done.
- Follow up on the candidate's previous answer: ask for specifics, trade-offs, what they would check first, what could go wrong.
- Never ask about age, origin, nationality, family, health, religion or anything unrelated to the job.
- Tags like [NAME] or [EMPLOYER] are privacy redactions. Never ask what they stand for.
- Never judge or score the candidate out loud. Be encouraging and neutral.
- Output only the next question.`;
}

export async function nextQuestion(need: Need, lang: Locale, turns: Turn[]): Promise<string> {
  const messages: ChatMessage[] = [{ role: "system", content: system(need, lang) }];
  if (turns.length === 0) {
    messages.push({ role: "user", content: "(The candidate has joined. Greet them in one short sentence and ask the first question.)" });
  }
  for (const t of turns) {
    messages.push({ role: "assistant", content: t.question }, { role: "user", content: t.answer });
  }
  return think(messages, { maxTokens: 300 });
}
