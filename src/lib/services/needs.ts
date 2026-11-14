import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, companies, needs } from "@/db";
import { ApiError, type ApiUser } from "@/lib/api";
import type { Need } from "@/lib/demo-data";
import { mapToEsco } from "@/lib/esco";
import { generateAnchors } from "@/lib/ai/rubric";

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
  input: { title: string; summary: string; skills: string[]; level?: "junior" | "mid" | "senior"; source?: string },
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
      level: input.level ?? "mid",
      source: input.source === "ai_drafted" ? "ai_drafted" : "written",
      confirmedBy: actor.id, // a human submitted it, so it is confirmed
      confirmedAt: new Date(),
    })
    .returning();
  return need;
}
