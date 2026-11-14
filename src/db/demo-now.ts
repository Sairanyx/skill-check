/**
 * Demo helper: book Aino on Leppävaara, Testing room 2, Workstation 1 in the slot running RIGHT NOW,
 * so a live demo can start immediately. Her earlier unused bookings are cancelled. Run: npm run demo:now
 */
import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { db, user, appointments, testSlots, workstations, testRooms } from "@/db";

async function main() {
  const aino = await db.query.user.findFirst({ where: eq(user.email, "aino@demo.skillcheck.fi") });
  if (!aino) throw new Error("Aino not found. Run npm run db:seed first.");
  const [ws] = await db
    .select({ id: workstations.id })
    .from(workstations)
    .innerJoin(testRooms, eq(workstations.roomId, testRooms.id))
    .where(and(eq(testRooms.name, "Testing room 2"), eq(workstations.label, "Workstation 1")));
  const now = new Date();
  const [slot] = await db.select().from(testSlots).where(and(eq(testSlots.workstationId, ws.id), lte(testSlots.startsAt, now), gt(testSlots.endsAt, now)));
  if (!slot) throw new Error("No slot running now. Run npm run db:seed to create new slots.");

  await db.update(appointments).set({ status: "cancelled" }).where(and(eq(appointments.candidateId, aino.id), inArray(appointments.status, ["booked", "in_progress"])));
  await db.update(appointments).set({ status: "cancelled" }).where(and(eq(appointments.slotId, slot.id), inArray(appointments.status, ["booked", "in_progress"]))); // free the slot
  await db.insert(appointments).values({ candidateId: aino.id, slotId: slot.id, needIds: ["nordic-logistics-data", "espoo-cloud-platform"] });
  console.log(`Aino is booked now (${slot.startsAt.toLocaleTimeString("fi-FI")} to ${slot.endsAt.toLocaleTimeString("fi-FI")}) on Leppävaara, Testing room 2, Workstation 1.`);
  process.exit(0);
}
main();
