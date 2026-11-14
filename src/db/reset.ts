/**
 * Wipe ALL data and re-seed clean demo data. For demo preparation only.
 * It has to switch off the audit protection for a moment, which only the database owner can do.
 * In production the app connects as a restricted role without that right.
 * Usage: npm run db:reset -- --yes
 */
import postgres from "postgres";

async function main() {
  if (!process.argv.includes("--yes")) {
    console.error("This deletes all data. Run: npm run db:reset -- --yes");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
  await sql.begin(async (tx) => {
    await tx`ALTER TABLE audit_events DISABLE TRIGGER USER`;
    await tx`ALTER TABLE decisions DISABLE TRIGGER USER`;
    await tx`TRUNCATE audit_events, decisions, bookings, evaluations, skill_checks, session_bookings, check_sessions,
      slots, rooms, event_companies, events, needs, companies, verification, account, session, jwks, "user" CASCADE`;
    await tx`ALTER TABLE audit_events ENABLE TRIGGER USER`;
    await tx`ALTER TABLE decisions ENABLE TRIGGER USER`;
  });
  console.log("All data wiped. Audit protection is back on. Now run: npm run db:seed");
  await sql.end();
}
main();
