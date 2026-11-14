import "server-only";
import { desc, eq, or } from "drizzle-orm";
import { db, auditEvents } from "@/db";
import type { ApiUser } from "@/lib/api";

export const PURPOSE = "City of Espoo recruitment event matching";

/** Write one append-only audit record. Call it whenever personal data is read or changed. */
export async function audit(
  actor: ApiUser | null,
  action: string,
  opts: { subjectId?: string; targetType?: string; targetId?: string; meta?: Record<string, unknown> } = {},
) {
  await db.insert(auditEvents).values({
    actorId: actor?.id ?? null,
    actorRole: actor?.role ?? "system",
    action,
    subjectId: opts.subjectId,
    targetType: opts.targetType,
    targetId: opts.targetId,
    purpose: PURPOSE,
    meta: opts.meta,
  });
}

/** City: the full trail. Candidate: everything that happened to their own data (transparency). */
export async function auditTrail(filter?: { subjectId?: string }) {
  return db
    .select()
    .from(auditEvents)
    .where(filter?.subjectId ? or(eq(auditEvents.subjectId, filter.subjectId), eq(auditEvents.actorId, filter.subjectId)) : undefined)
    .orderBy(desc(auditEvents.at))
    .limit(500);
}
