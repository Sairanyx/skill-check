// Applies raw SQL files that drizzle-kit cannot express (triggers). Usage: npm run db:audit
import { readFileSync } from "node:fs";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
  await sql.unsafe(readFileSync("src/db/sql/immutable-audit.sql", "utf8"));
  console.log("Audit triggers applied: audit_events and decisions are append-only.");
  await sql.end();
}
main();
