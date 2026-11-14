import "server-only";
import { pageAsMarkdown } from "@/lib/context-dev";
import { proofType } from "@/lib/proofs";
import { desc, eq } from "drizzle-orm";
import { db, companies, needs } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import type { Need } from "@/lib/demo-data";
import { mapToEsco } from "@/lib/esco";
import { generateAnchors } from "@/lib/ai/rubric";
import { thinkJson } from "@/lib/ai/llm";
import { audit } from "./audit";

/** A need together with its company name, in the shape the AI agents expect. */
export async function loadNeed(needId: string): Promise<Need & { companyId: string; ownerId: string; checkMode: string }> {
  const [row] = await db
    .select({ need: needs, company: companies })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .where(eq(needs.id, needId));
  if (!row) throw new ApiError(404, "Need not found");
  return {
    id: row.need.id,
    company: row.company.name,
    companyId: row.company.id,
    ownerId: row.company.ownerId,
    title: row.need.title,
    summary: row.need.summary,
    skills: row.need.skills,
    level: row.need.level,
    checkMode: row.need.checkMode,
    questionBank: row.need.questionBankReview?.ok === false ? null : row.need.questionBank, // unscreened banks are not used
    companyDescription: row.company.description,
    anchors: row.need.anchors,
    languageRequirements: row.need.languageRequirements,
    proofRequirements: row.need.proofRequirements,
  };
}

export async function listNeeds() {
  const rows = await db
    .select({
      id: needs.id,
      title: needs.title,
      summary: needs.summary,
      skills: needs.skills,
      escoSkills: needs.escoSkills,
      level: needs.level,
      companyId: needs.companyId,
      company: companies.name,
    })
    .from(needs)
    .innerJoin(companies, eq(needs.companyId, companies.id))
    .orderBy(desc(needs.createdAt));
  // The company's choice for its next event (and the City's event policy) decides if a check is needed.
  const { effectiveCheckMode } = await import("./company");
  return Promise.all(rows.map(async (r) => ({ ...r, checkMode: await effectiveCheckMode(r.companyId) })));
}

export async function createNeed(
  actor: ApiUser,
  input: { title: string; summary: string; skills: string[]; level?: "junior" | "mid" | "senior"; source?: string; languageRequirements?: { language: "fi" | "sv" | "en"; level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"; proof?: "required" | "optional" }[]; proofRequirements?: { code: string; required: boolean }[] },
) {
  const company = await db.query.companies.findFirst({ where: eq(companies.ownerId, actor.id) });
  if (!company) throw new ApiError(400, "Create your company profile first");
  if (!input.title?.trim() || !input.summary?.trim() || !input.skills?.length)
    throw new ApiError(400, "title, summary and at least one skill are required");
  const skills = input.skills.map((s) => s.trim()).filter(Boolean);
  const [escoSkills, anchors] = await Promise.all([
    mapToEsco(skills, `${input.title}: ${input.summary}`),
    generateAnchors({ title: input.title, summary: input.summary, skills, level: input.level ?? "mid" }),
  ]);
  const [need] = await db
    .insert(needs)
    .values({
      companyId: company.id,
      title: input.title.trim(),
      summary: input.summary.trim(),
      skills,
      escoSkills,
      anchors,
      languageRequirements: input.languageRequirements?.filter((r) => ["fi", "sv", "en"].includes(r.language) && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(r.level)).map((r) => ({ language: r.language, level: r.level, proof: r.proof === "required" ? ("required" as const) : ("optional" as const) })) ?? null,
      proofRequirements: input.proofRequirements?.filter((r) => proofType(r.code) && proofType(r.code)!.kind !== "language").map((r) => ({ code: r.code, required: !!r.required })) ?? null,
      level: input.level ?? "mid",
      source: input.source === "ai_drafted" ? "ai_drafted" : "written",
      confirmedBy: actor.id, // a human submitted it, so it is confirmed
      confirmedAt: new Date(),
    })
    .returning();
  return need;
}

/**
 * Draft a need from the company's own website or job post (Context.dev reads the page, Gemma drafts).
 * Nothing is saved: the company checks and edits the draft in the normal form.
 */
export async function draftNeedFromUrl(actor: ApiUser, url: string) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new ApiError(400, "Paste a full web address, for example https://yourcompany.fi/careers");
  }
  if (!["http:", "https:"].includes(u.protocol)) throw new ApiError(400, "Only http and https addresses");
  if (!process.env.CONTEXT_DEV_API_KEY) throw new ApiError(503, "Reading websites is not switched on yet");
  const page = await pageAsMarkdown(u.toString()).catch((e) => {
    throw new ApiError(502, (e as Error).message);
  });
  const draft = await thinkJson<{ title: string; summary: string; skills: string[]; level: "junior" | "mid" | "senior" }>(
    [
      {
        role: "system",
        content: `You help a company describe ONE real problem it needs help with, for a skill check at a City of Espoo recruitment event.
From the web page, write: a short title in the form "job: problem" (for example "Cloud engineer: cost control"), a 2 to 3 sentence summary of the real problem, 3 to 5 key skills, and the level.
Describe the work, not the person: never mention age, gender, nationality, native language, health or family. No dashes or semicolons.`,
      },
      { role: "user", content: `PAGE: ${page.title ?? ""}\n\n${page.markdown}` },
    ],
    {
      json: {
        type: "object",
        properties: { title: { type: "string" }, summary: { type: "string" }, skills: { type: "array", items: { type: "string" } }, level: { type: "string", enum: ["junior", "mid", "senior"] } },
        required: ["title", "summary", "skills", "level"],
      },
      maxTokens: 600,
      temperature: 0.2,
    },
  );
  await audit(actor, "need.drafted_from_website", { targetType: "url", targetId: u.hostname });
  return { ...draft, skills: draft.skills.slice(0, 6), source: u.toString() };
}
