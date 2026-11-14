import "server-only";
import { thinkJsonRaw } from "./llm";

/**
 * BARS (Behaviourally Anchored Rating Scales): for each skill of a need, describe in advance what an answer
 * at level 1, 3 and 5 looks like, plus a few yes/no checklist items. Generated once per need, shown to the
 * company, and used by the evaluator so every candidate is scored against the same written standard.
 */
export type SkillAnchors = {
  skill: string;
  anchors: { "1": string; "3": string; "5": string };
  checklist: string[]; // short observable behaviours, e.g. "explains how to verify the result"
};

const SCHEMA = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          anchors: {
            type: "object",
            properties: { "1": { type: "string" }, "3": { type: "string" }, "5": { type: "string" } },
            required: ["1", "3", "5"],
          },
          checklist: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
        },
        required: ["skill", "anchors", "checklist"],
      },
    },
  },
  required: ["skills"],
};

export async function generateAnchors(need: { title: string; summary: string; skills: string[]; level: string }): Promise<SkillAnchors[]> {
  const raw = await thinkJsonRaw(
    [
      {
        role: "system",
        content: `You write Behaviourally Anchored Rating Scales for a short spoken/written skill interview.
For EACH listed skill write:
- anchors "1", "3", "5": one sentence each describing an OBSERVABLE answer at that level for this job (1 = vague or no method, 3 = a correct, workable approach, 5 = a correct approach plus trade-offs, edge cases or how to verify it).
- checklist: 2 to 4 short yes/no behaviours a good answer shows.
Rules: describe what the person SAYS or EXPLAINS, never personality, background, education, fluency or accent. Target level: ${need.level}. Keep each item under 25 words. Use English.`,
      },
      { role: "user", content: `Job: ${need.title}\n${need.summary}\nSkills: ${need.skills.join(", ")}` },
    ],
    { json: SCHEMA, maxTokens: 2000 },
  );
  const out = (JSON.parse(raw) as { skills: SkillAnchors[] }).skills;
  // Keep exactly the company's skills, in the company's order.
  return need.skills.map((s) => out.find((o) => o.skill.toLowerCase() === s.toLowerCase()) ?? out.find((o) => o.skill.toLowerCase().includes(s.toLowerCase().split(" ")[0])) ?? { skill: s, anchors: { "1": "Vague or no method.", "3": "A correct, workable approach.", "5": "A correct approach with trade-offs or verification." }, checklist: [] }).map((a, i) => ({ ...a, skill: need.skills[i] }));
}
