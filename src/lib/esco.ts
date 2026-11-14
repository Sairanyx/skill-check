import "server-only";
import { thinkJsonRaw } from "@/lib/ai/llm";
import type { EscoSkill } from "@/db/schema";

/**
 * Map free-text skills to the EU ESCO skills taxonomy (public API, no key).
 * ESCO keyword search is noisy, so Gemma picks the best of the top results, or none.
 */
const ESCO = "https://ec.europa.eu/esco/api";

type Hit = { title: string; uri: string };

async function search(text: string): Promise<Hit[]> {
  const url = `${ESCO}/search?text=${encodeURIComponent(text)}&language=en&type=skill&limit=8`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];
  const data = (await res.json()) as { _embedded?: { results?: Hit[] } };
  return (data._embedded?.results ?? []).map((r) => ({ title: r.title, uri: r.uri }));
}

async function labels(uri: string): Promise<EscoSkill["label"]> {
  const res = await fetch(`${ESCO}/resource/skill?uri=${encodeURIComponent(uri)}&language=en`, { signal: AbortSignal.timeout(10_000) });
  const d = (await res.json()) as { title: string; preferredLabel?: Record<string, string> };
  return { en: d.preferredLabel?.en ?? d.title, fi: d.preferredLabel?.fi, sv: d.preferredLabel?.sv };
}

async function pick(skill: string, context: string, hits: Hit[]): Promise<Hit | null> {
  if (!hits.length) return null;
  const raw = await thinkJsonRaw(
    [
      {
        role: "system",
        content:
          'Pick the ESCO skill that means the SAME thing as the job skill in this job context. ' +
          "Watch for words with other meanings (e.g. 'cause' as in a charity cause, 'react' as in reacting). " +
          'If none means the same thing, or you are unsure, answer {"index": -1}. A wrong match is worse than no match. ' +
          'Answer {"index": n} with the number from the list.',
      },
      { role: "user", content: `Job: ${context}\nSkill: ${skill}\n\n${hits.map((h, i) => `${i}. ${h.title}`).join("\n")}` },
    ],
    { json: { type: "object", properties: { index: { type: "integer" } }, required: ["index"] }, maxTokens: 20 },
  );
  const i = (JSON.parse(raw) as { index: number }).index;
  return hits[i] ?? null;
}

export async function mapToEsco(skills: string[], context: string): Promise<EscoSkill[]> {
  const out = await Promise.all(
    skills.map(async (input) => {
      try {
        const hit = await pick(input, context, await search(input));
        return hit ? { input, uri: hit.uri, label: await labels(hit.uri) } : null;
      } catch {
        return null; // ESCO is a bonus: never block saving a need
      }
    }),
  );
  return out.filter((x): x is EscoSkill => x !== null);
}
