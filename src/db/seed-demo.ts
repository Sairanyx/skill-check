/**
 * Larger synthetic demo dataset. Run after the base seed:
 *   npm run db:reset -- --yes && npm run db:seed && npm run db:demo
 *
 * Everything is fictional (company names checked against the Finnish Trade Register, .demo emails).
 * Jobseekers mirror Espoo's language mix (end of 2025: 68.0% Finnish, 6.2% Swedish, 25.9% other languages,
 * largest: Russian, Arabic, English, Estonian, Chinese, Farsi, Albanian; source: espoo.fi/en/population).
 * Skill checks run through the REAL pipeline: Gemma role-plays each jobseeker answering the real interviewer,
 * then the privacy guard and the BARS evaluator score it. Decisions go through the real services.
 */
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, user, companies, needs, events, eventCompanies, eventNeeds, workstations, testSlots, appointments, skillChecks, evaluations, meetingSlots, type StoredTurn } from "@/db";
import { mapToEsco } from "@/lib/esco";
import { generateAnchors } from "@/lib/ai/rubric";
import { nextQuestion, MAX_TURNS, difficultyReached } from "@/lib/ai/interviewer";
import { pseudonymise } from "@/lib/ai/guard";
import { evaluate } from "@/lib/ai/evaluator";
import { think } from "@/lib/ai/llm";
import { audit } from "@/lib/services/audit";
import { loadNeed } from "@/lib/services/needs";
import { decide, book } from "@/lib/services/decisions";
import { setContactShare } from "@/lib/services/privacy";
import { setShowOnCard } from "@/lib/services/checks";
import type { ApiUser } from "@/lib/api";
import type { Locale } from "@/i18n/config";

const PASSWORD = process.env.SEED_PASSWORD ?? "junction2026";
const MIN = 60_000;

/* ---------- fictional companies (all checked: no match in the PRH trade register) ---------- */
const COMPANIES = [
  { key: "otaniemi", name: "Otaniemi Networks Oy", sector: "Telecom", about: "Builds and tests 5G network equipment.", need: { id: "otaniemi-test-engineer", title: "Network test engineer", summary: "Our 5G base stations fail tests in ways nobody can reproduce. We need someone who can design test cases, read logs and narrow down root causes.", skills: ["test design", "log analysis", "networking basics", "root-cause analysis"], level: "mid" }, mode: "required" },
  { key: "keilaniemi", name: "Keilaniemi Energy Oy", sector: "Energy", about: "Runs a regional electricity grid and forecasts demand.", need: { id: "keilaniemi-data-engineer", title: "Data engineer: grid forecasting", summary: "Our demand forecasts miss cold spells. We need someone who can build reliable data pipelines from meter data and spot bad data before it breaks the forecast.", skills: ["data pipelines", "data quality", "SQL", "time series basics"], level: "mid" }, mode: "required" },
  { key: "lifts", name: "Leppävaara Lifts Oy", sector: "Engineering", about: "Maintains lifts and escalators in Espoo.", need: { id: "lifts-service-technician", title: "Service technician", summary: "Technicians visit sites alone, diagnose faults safely and explain the problem to building managers.", skills: ["fault diagnosis", "safety procedures", "customer communication"], level: "junior" }, mode: "optional" },
  { key: "health", name: "Matinkylä Health Oy", sector: "Health tech", about: "Software for home-care nurses.", need: { id: "health-customer-success", title: "Customer success specialist (Finnish + Swedish)", summary: "We help care organisations adopt our app. You handle frustrated users, find the real problem and turn feedback into clear tickets.", skills: ["problem clarification", "customer communication", "prioritisation", "writing clear tickets"], level: "mid" }, mode: "required" },
  { key: "games", name: "Suomenoja Games Oy", sector: "Games", about: "Small studio making mobile puzzle games.", need: { id: "games-qa-tester", title: "QA tester", summary: "Find bugs before players do, write reproducible bug reports and decide what is worth fixing first.", skills: ["bug reproduction", "bug reporting", "prioritisation"], level: "junior" }, mode: "optional" },
  { key: "build", name: "Espoo Build Oy", sector: "Construction", about: "Builds apartment blocks in the Espoo region.", need: { id: "build-site-coordinator", title: "Site coordinator", summary: "Keep subcontractors, deliveries and safety on schedule on a busy site, and solve problems when plans change.", skills: ["planning", "safety awareness", "problem solving", "communication with subcontractors"], level: "mid" }, mode: "required" },
  { key: "retail", name: "Espoonlahti Retail Oy", sector: "Retail", about: "Runs grocery stores in southern Espoo.", need: { id: "retail-team-lead", title: "Store team lead", summary: "Lead a team of 8 in a busy store.", skills: ["team leadership", "customer service", "scheduling"], level: "junior" }, mode: "off" },
] as const;

/* ---------- synthetic jobseekers, mirroring Espoo's language mix ---------- */
type Persona = { name: string; mother: string; answerLang: Locale; nonNative: boolean };
const FI = ["Aino Virtanen", "Juho Korhonen", "Emma Mäkinen", "Mikko Nieminen", "Sara Hämäläinen", "Ville Laine", "Noora Heikkinen", "Teemu Koskinen", "Laura Järvinen", "Antti Lehtonen", "Iida Lehtinen", "Joonas Saarinen", "Hanna Salminen", "Eetu Heinonen", "Veera Niemi", "Oskari Kinnunen", "Pia Turunen"].map((name) => ({ name, mother: "Finnish", answerLang: "fi" as Locale, nonNative: false }));
const SV = [{ name: "Elin Lindholm", mother: "Swedish", answerLang: "sv" as Locale, nonNative: false }, { name: "Oscar Sjöberg", mother: "Swedish", answerLang: "sv" as Locale, nonNative: false }];
const OTHER: Persona[] = [
  { name: "Dmitri Volkov", mother: "Russian", answerLang: "en", nonNative: true },
  { name: "Olga Smirnova", mother: "Russian", answerLang: "fi", nonNative: true },
  { name: "Omar Haddad", mother: "Arabic", answerLang: "en", nonNative: true },
  { name: "Layla Al-Sayed", mother: "Arabic", answerLang: "fi", nonNative: true },
  { name: "Daniel Brooks", mother: "English", answerLang: "en", nonNative: false },
  { name: "Kristjan Tamm", mother: "Estonian", answerLang: "fi", nonNative: true },
  { name: "Wei Zhang", mother: "Chinese", answerLang: "en", nonNative: true },
  { name: "Shirin Rahimi", mother: "Farsi", answerLang: "en", nonNative: true },
  { name: "Arben Krasniqi", mother: "Albanian", answerLang: "en", nonNative: true },
  { name: "Hodan Ali", mother: "Somali", answerLang: "fi", nonNative: true },
  { name: "Oksana Kovalenko", mother: "Ukrainian", answerLang: "en", nonNative: true },
];
const PEOPLE: Persona[] = [...FI, ...SV, ...OTHER];
const LEVELS = ["strong", "medium", "weak"] as const;
const LEVEL_TEXT = {
  strong: "You are genuinely skilled: give a concrete method, mention a trade-off or how you would check your result, and one real example from past work.",
  medium: "You know the basics: give a reasonable but simple answer without much detail or trade-offs.",
  weak: "You have little real experience: give a short, vague answer that does not really explain how.",
};
const LANG = { fi: "Finnish", sv: "Swedish", en: "English" } as const;

async function roleplayAnswer(p: Persona, level: (typeof LEVELS)[number], question: string, history: string) {
  return think(
    [
      {
        role: "system",
        content: `You role-play a jobseeker in a short skill interview. Answer the interviewer's last question in ${LANG[p.answerLang]}, 2 to 4 sentences, in first person.
${LEVEL_TEXT[level]}
${p.nonNative ? `${LANG[p.answerLang]} is not your mother tongue (${p.mother} is): use simple sentences and a few grammar mistakes, but keep the SAME quality of reasoning.` : ""}
In about one answer in three, mention your name (${p.name}) or a previous employer or school by name, as people naturally do. Output only the answer.`,
      },
      { role: "user", content: `${history}\nINTERVIEWER: ${question}` },
    ],
    { maxTokens: 250, temperature: 0.8 },
  );
}

/** One full skill check through the real pipeline (without the kiosk, for seeding only). */
async function runCheck(candidate: { id: string }, p: Persona, needId: string, level: (typeof LEVELS)[number], appointmentId: string, workstationId: string, finishedAt: Date) {
  const need = await loadNeed(needId);
  const turns: StoredTurn[] = [];
  let history = "";
  let next = await nextQuestion(need, p.answerLang, []);
  for (let i = 0; i < MAX_TURNS; i++) {
    const said = (await roleplayAnswer(p, level, next.question, history)).trim();
    const seen = await pseudonymise(said);
    turns.push({ question: next.question, said, seen, difficulty: next.difficulty });
    history += `\nINTERVIEWER: ${next.question}\nYOU: ${said}`;
    if (i < MAX_TURNS - 1) next = await nextQuestion(need, p.answerLang, turns.map((t) => ({ question: t.question, answer: t.seen, difficulty: t.difficulty })));
  }
  const ev = await evaluate(need, turns.map((t) => ({ question: t.question, answer: t.seen, difficulty: t.difficulty })));
  const needsReview = ev.confidence < 0.6 || ev.fairness.flags.length > 0;
  const [check] = await db
    .insert(skillChecks)
    .values({ candidateId: candidate.id, needId, appointmentId, workstationId, language: p.answerLang, status: needsReview ? "needs_review" : "evaluated", turns, startedAt: new Date(finishedAt.getTime() - 25 * MIN), finishedAt, expiresAt: new Date(finishedAt.getTime() + 365 * 24 * 60 * MIN) })
    .returning();
  await db.insert(evaluations).values({ checkId: check.id, match: ev.match, level: ev.level, confidence: ev.confidence, difficulty: difficultyReached(turns), rubric: ev.rubric, strengths: ev.strengths, gaps: ev.gaps, fairnessFlags: ev.fairness.flags, fairnessNote: ev.fairness.note, model: ev.model, method: ev.method });
  await audit({ id: candidate.id, name: p.name, email: "", role: "candidate" }, "check.started", { subjectId: candidate.id, targetType: "skill_check", targetId: check.id, meta: { needId, language: p.answerLang, seeded: true } });
  await audit(null, "evaluation.created", { subjectId: candidate.id, targetType: "skill_check", targetId: check.id, meta: { model: ev.model, match: ev.match, confidence: ev.confidence, routedToHumanReview: needsReview } });
  return { check, ev, needsReview };
}

/** Run async jobs with limited parallelism (the GPU handles a few at once). */
async function pool<T>(items: T[], size: number, fn: (t: T, i: number) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

const actor = (u: { id: string; name: string; email: string; role: string }): ApiUser => ({ id: u.id, name: u.name, email: u.email, role: u.role as ApiUser["role"] });

async function main() {
  const t0 = Date.now();
  const city = (await db.query.user.findFirst({ where: eq(user.email, "events@espoo.demo") }))!;
  const [event] = await db.select().from(events).limit(1);
  if (!city || !event) throw new Error("Run npm run db:seed first");

  // 1. Companies, needs (with ESCO + BARS anchors), event applications
  console.log("Companies and needs…");
  for (const c of COMPANIES) {
    const email = `recruiter@${c.key}.demo`;
    if (!(await db.query.user.findFirst({ where: eq(user.email, email) }))) await auth.api.signUpEmail({ body: { email, name: c.name.replace(" Oy", ""), password: PASSWORD } });
    await db.update(user).set({ role: "company" }).where(eq(user.email, email));
    const owner = (await db.query.user.findFirst({ where: eq(user.email, email) }))!;
    const [co] = await db.insert(companies).values({ name: c.name, ownerId: owner.id, sector: c.sector, website: `https://${c.key}.demo`, description: `Fictional company for the Skill Check demo. ${c.about}` }).returning();
    const [esco, anchors] = await Promise.all([mapToEsco([...c.need.skills], `${c.need.title}: ${c.need.summary}`), generateAnchors({ ...c.need, skills: [...c.need.skills] })]);
    await db.insert(needs).values({ ...c.need, skills: [...c.need.skills], level: c.need.level, companyId: co.id, escoSkills: esco, anchors, confirmedBy: owner.id, confirmedAt: new Date() });
    const confirmed = c.key !== "build"; // Espoo Build applied, approved, not yet confirmed
    await db.insert(eventCompanies).values({ eventId: event.id, companyId: co.id, checkMode: c.mode, approvedAt: new Date(), approvedBy: city.id, confirmedAt: confirmed ? new Date() : null, confirmedBy: confirmed ? owner.id : null });
    await db.insert(eventNeeds).values({ eventId: event.id, needId: c.need.id });
  }

  // 2. Jobseekers
  console.log(`Jobseekers (${PEOPLE.length})…`);
  const people: { p: Persona; u: { id: string } }[] = [];
  for (const [i, p] of PEOPLE.entries()) {
    const email = `jobseeker${String(i + 1).padStart(2, "0")}@demo.skillcheck.fi`;
    if (!(await db.query.user.findFirst({ where: eq(user.email, email) }))) await auth.api.signUpEmail({ body: { email, name: p.name, password: PASSWORD } });
    people.push({ p, u: (await db.query.user.findFirst({ where: eq(user.email, email) }))! });
  }

  // 3. Past testing slots (yesterday) so finished checks have a real booking on a real workstation
  const ws = await db.select().from(workstations);
  const checkNeeds = ["nordic-logistics-data", "espoo-cloud-platform", ...COMPANIES.filter((c) => c.mode !== "off").map((c) => c.need.id)];
  const existingNeedIds = new Set((await db.select({ id: needs.id }).from(needs)).map((n) => n.id));
  const pickable = checkNeeds.filter((id) => existingNeedIds.has(id));
  const plan = people.map(({ p, u }, i) => ({ p, u, level: LEVELS[i % 3], needId: pickable[i % pickable.length], ws: ws[i % ws.length], at: new Date(Date.now() - (26 - (i % 8)) * 60 * MIN) }));

  console.log(`Skill checks (${plan.length}) through the real pipeline, 4 at a time…`);
  const results: { check: typeof skillChecks.$inferSelect; match: number; needsReview: boolean; u: { id: string }; p: Persona }[] = [];
  await pool(plan, 4, async (x, i) => {
    const [slot] = await db.insert(testSlots).values({ workstationId: x.ws.id, startsAt: new Date(x.at.getTime() - 30 * MIN), endsAt: x.at }).returning();
    const [appt] = await db.insert(appointments).values({ candidateId: x.u.id, slotId: slot.id, needIds: [x.needId], status: "completed" }).returning();
    const t = Date.now();
    const r = await runCheck(x.u, x.p, x.needId, x.level, appt.id, x.ws.id, x.at).catch((e) => {
      console.log(`  ${String(i + 1).padStart(2)}/${plan.length} skipped: ${(e as Error).message.slice(0, 80)}`);
      return null;
    });
    if (!r) return;
    results.push({ check: r.check, match: r.ev.match, needsReview: r.needsReview, u: x.u, p: x.p });
    console.log(`  ${String(i + 1).padStart(2)}/${plan.length} ${x.p.mother.padEnd(9)} ${x.p.answerLang}${x.p.nonNative ? "*" : " "} ${x.level.padEnd(6)} → match ${r.ev.match}, conf ${r.ev.confidence}${r.needsReview ? ", REVIEW" : ""} (${((Date.now() - t) / 1000).toFixed(0)}s)`);
  });

  // 4. Human decisions through the real rules: the City accepts most strong results, companies decide on some
  console.log("Decisions, meetings, consent…");
  const companyActor = async (needId: string) => {
    const [n] = await db.select({ ownerId: companies.ownerId }).from(needs).innerJoin(companies, eq(needs.companyId, companies.id)).where(eq(needs.id, needId));
    return actor((await db.query.user.findFirst({ where: eq(user.id, n.ownerId) }))!);
  };
  const cityActor = actor(city);
  const [freeSlot] = await db.select().from(meetingSlots).where(eq(meetingSlots.eventId, event.id));
  let k = 0;
  for (const r of results.filter((x) => !x.needsReview).sort((a, b) => b.match - a.match)) {
    k++;
    const comp = await companyActor(r.check.needId);
    if (r.match >= 6) {
      await decide(cityActor, r.check.id, "invite", "Evidence matches the anchors for most skills.");
      if (k % 3 === 0) await decide(comp, r.check.id, "invite", "Strong reasoning, we want to meet.");
      if (k % 4 === 0) {
        const slots = await db.select().from(meetingSlots).where(and(eq(meetingSlots.eventId, event.id), gt(meetingSlots.startsAt, new Date(0))));
        const used = new Set((await db.query.bookings.findMany()).map((b) => b.slotId));
        const s = slots.find((x) => !used.has(x.id)) ?? freeSlot;
        const cand = actor({ id: r.u.id, name: r.p.name, email: "", role: "candidate" });
        await book(cand, r.check.id, s.id).catch(() => {});
        if (k % 8 === 0) await setContactShare(cand, (await db.query.companies.findFirst({ where: eq(companies.ownerId, comp.id) }))!.id, true);
        await setShowOnCard(cand, true);
      }
    } else if (r.match >= 4 && k % 2 === 0) {
      await decide(comp, r.check.id, "not_now", "Not enough evidence for this role yet.");
    }
  }
  // Two results a company sent to the City for review
  for (const r of results.filter((x) => !x.needsReview).slice(-2)) await decide(await companyActor(r.check.needId), r.check.id, "needs_review", "Please take a second look.");

  const review = await db.select().from(skillChecks).where(eq(skillChecks.status, "needs_review"));
  console.log(`Done in ${((Date.now() - t0) / 60000).toFixed(1)} min: ${results.length} checks, ${review.length} in the City review queue.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
