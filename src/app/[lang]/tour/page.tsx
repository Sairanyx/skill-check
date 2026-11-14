import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { hasLocale } from "@/i18n/config";
import { db, events, skillChecks, user } from "@/db";
import { TourStart } from "@/components/site/tour-start";

/** Guided demo: pick "watch" or "try". The story follows Aino, then the company, then the City. */
export default async function TourPage({ params }: PageProps<"/[lang]/tour">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection(); // read the live demo data on every visit, never at build time
  const [ev] = await db.select({ id: events.id }).from(events).where(eq(events.title, "Espoo Tech Talent Day")).limit(1);
  const [check] = await db
    .select({ id: skillChecks.id, needId: skillChecks.needId })
    .from(skillChecks)
    .innerJoin(user, eq(user.id, skillChecks.candidateId))
    .where(and(eq(user.email, "aino@demo.skillcheck.fi"), isNotNull(skillChecks.finishedAt)))
    .orderBy(desc(skillChecks.finishedAt))
    .limit(1);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href={`/${lang}`} className="text-sm font-medium text-primary hover:underline">← Home</Link>
      <p className="mt-6 text-sm font-medium text-primary">Guided demo</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">SkillCheck in 8 steps</h1>
      <p className="mt-4 text-lg text-muted-foreground">Follow Aino from an Espoo recruitment event to a skill check in an EXAM room, then see the company and the City. All people and companies are fictional.</p>
      {ev && check ? (
        <TourStart lang={lang} ids={{ event: ev.id, check: check.id, need: check.needId }} />
      ) : (
        <p className="mt-10 text-sm text-destructive">The demo story is being prepared. Please try again in a moment.</p>
      )}
    </div>
  );
}
