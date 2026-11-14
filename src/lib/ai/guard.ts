import "server-only";
import { vllm } from "./openai-compat";

/**
 * Privacy guard: pseudonymise a candidate answer before any external AI sees it.
 * Layer 1: deterministic patterns (emails, phones, URLs). Layer 2: Gemma 4 on Verda (Helsinki)
 * for names, employers, schools, places, nationality and other personal details.
 */
const PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[CONTACT]"],
  [/https?:\/\/\S+|www\.\S+/g, "[CONTACT]"],
  [/(\+?\d[\d\s-]{6,}\d)/g, "[CONTACT]"],
];

/**
 * Categories follow the Finnish Non-Discrimination Act (Yhdenvertaisuuslaki 1325/2014, §8) and the
 * Equality Act (609/1986): age, origin, nationality, language, religion, belief, opinion, political activity,
 * trade union activity, family relationships, health, disability, sexual orientation, gender, other personal
 * characteristics. Plus direct identifiers (names, employers, schools, places, contact details).
 */
export const GUARD_SYSTEM = `You are a privacy filter for a public-sector recruitment skill check in Finland. Rewrite the user's text so that it contains no identifying details and nothing about the grounds protected by the Finnish Non-Discrimination Act. Change NOTHING else (same language, same wording, same technical content, same reasoning).

Replace with tags:
- person names -> [NAME]
- employers, companies, clients, brands of former workplaces -> [EMPLOYER]
- schools, universities, courses with an institution name -> [SCHOOL]
- cities, countries, regions, addresses, places -> [PLACE]
- nationality, ethnic origin, mother tongue, where someone learned a language -> [ORIGIN]
- emails, phone numbers, URLs, social handles -> [CONTACT]
- calendar years or dates that reveal age, studies or life events ("born 1985", "graduated in 1998", "moved here in 2022") -> [YEAR]
- age, gender, religion, belief, political views, union membership, family situation, health, disability, sexual orientation -> [PERSONAL]

KEEP unchanged:
- durations and amounts ("3 years of SQL", "a 6-month project", "30%", "200 parcels")
- technologies, tools, versions, methods (Python 3.12, Kubernetes, Excel)
- statements about language SKILLS that are about the job ("I handle customers in Swedish")

Output only the rewritten text.`;

export function patternPass(text: string): string {
  return PATTERNS.reduce((t, [re, tag]) => t.replace(re, tag), text);
}

export async function pseudonymise(text: string): Promise<string> {
  const prefiltered = patternPass(text);
  const out = await vllm<{ choices: { message: { content: string } }[] }>(
    process.env.GUARD_BASE_URL!,
    "/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GUARD_MODEL ?? "gemma",
        temperature: 0,
        max_tokens: 1024,
        messages: [
          { role: "system", content: GUARD_SYSTEM },
          { role: "user", content: prefiltered },
        ],
      }),
    },
  );
  return out.choices[0].message.content.trim();
}
