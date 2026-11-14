/**
 * Panel benchmark (demo data only): re-score every stored skill check with the judges in JUDGES
 * and report how much they agree, per judge and for native vs non-native speakers.
 * Nothing is written to the database. Run: JUDGES=gemma,mistral,gemini npm run bench:panel
 */
import { asc, eq } from "drizzle-orm";
import { db, skillChecks, user } from "@/db";
import { evaluate } from "@/lib/ai/evaluator";
import { loadNeed } from "@/lib/services/needs";
import { judges } from "@/lib/ai/llm";

const matchOf = (scores: number[]) => {
  const shown = scores.filter((x) => x > 0);
  return shown.length ? Math.round((shown.reduce((a, b) => a + b, 0) / shown.length / 5) * 100) / 10 : 0;
};
const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : NaN);

async function main() {
  const panel = judges();
  const rows = await db
    .select({ check: skillChecks, email: user.email })
    .from(skillChecks)
    .innerJoin(user, eq(user.id, skillChecks.candidateId))
    .where(eq(skillChecks.status, "evaluated"))
    .orderBy(asc(user.email));
  const checks = rows.filter((r) => r.email.startsWith("jobseeker"));
  console.log(`Judges: ${panel.join(", ")} · ${checks.length} demo checks\n`);
  const out: { nonNative: boolean; perJudge: (number | null)[]; panel: number; agreement: number }[] = [];
  const queue = [...checks];
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        const n = Number(r.email.match(/jobseeker(\d+)/)?.[1]);
        const nonNative = n >= 20 && n !== 24; // demo personas 20–30 answer in a language that is not their mother tongue (24 is a native English speaker)
        try {
          const ev = await evaluate(await loadNeed(r.check.needId), r.check.turns.map((t) => ({ question: t.question, answer: t.seen, difficulty: t.difficulty })));
          let k = 0;
          const perJudge = ev.method.judges.length > 1 ? ev.method.judges.map((j) => (j.ok ? matchOf(ev.method.runs[k++]) : null)) : [matchOf(ev.method.runs[0])];
          out.push({ nonNative, perJudge, panel: ev.match, agreement: ev.method.agreement });
          console.log(`${r.email.slice(0, 11)} ${nonNative ? "non-native" : "native    "} ${perJudge.map((m, i) => `${panel[i]} ${m ?? "failed"}`).join(" · ")} → panel ${ev.match}, agreement ${ev.method.agreement}`);
        } catch (e) {
          console.log(`${r.email.slice(0, 11)} skipped: ${(e as Error).message.slice(0, 80)}`);
        }
      }
    }),
  );
  console.log("\nAverage match per judge (native / non-native / gap):");
  panel.forEach((j, i) => {
    const nat = out.filter((o) => !o.nonNative && o.perJudge[i] !== null).map((o) => o.perJudge[i]!);
    const non = out.filter((o) => o.nonNative && o.perJudge[i] !== null).map((o) => o.perJudge[i]!);
    console.log(`  ${j.padEnd(8)} ${mean(nat)} / ${mean(non)} / gap ${Math.round((mean(nat) - mean(non)) * 100) / 100}`);
  });
  const nat = out.filter((o) => !o.nonNative).map((o) => o.panel);
  const non = out.filter((o) => o.nonNative).map((o) => o.panel);
  console.log(`  panel    ${mean(nat)} / ${mean(non)} / gap ${Math.round((mean(nat) - mean(non)) * 100) / 100}`);
  console.log(`Agreement between judges (1 = identical): ${mean(out.map((o) => o.agreement))}`);
  process.exit(0);
}
main();
