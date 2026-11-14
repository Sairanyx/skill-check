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

export const GUARD_SYSTEM = `You are a privacy filter for a recruitment skill check. Rewrite the user's text so that it contains no personal or identifying details, and change NOTHING else (same language, same wording, same technical content, same skills and numbers about work done).
Replace with tags:
- person names -> [NAME]
- employers, companies, clients -> [EMPLOYER]
- schools, universities -> [SCHOOL]
- cities, countries, addresses, places -> [PLACE]
- nationality or ethnicity -> [NATIONALITY]
- emails, phone numbers, URLs, social handles -> [CONTACT]
- age, gender, religion, health, family status -> [PERSONAL]
Keep technologies, tools, methods and quantities (e.g. Python, Kubernetes, 30%) unchanged.
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
        model: process.env.GUARD_MODEL ?? "gemma-4-12b",
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
