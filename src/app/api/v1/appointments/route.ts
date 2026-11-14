import { api, caller } from "@/lib/api";
import { bookAppointment, myAppointments } from "@/lib/services/testing";

/** GET /api/v1/appointments: my testing-room bookings. */
export const GET = api(async (req) => myAppointments(await caller(req, ["candidate"])));

/** POST /api/v1/appointments {slotId, needIds[1..3]}: book a workstation and time. */
export const POST = api(async (req) => {
  const me = await caller(req, ["candidate"]);
  const { slotId, needIds } = await req.json();
  return bookAppointment(me, slotId, needIds);
});
