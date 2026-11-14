import { api, caller } from "@/lib/api";
import { cancelAppointment, rescheduleAppointment } from "@/lib/services/testing";

/** PATCH /api/v1/appointments/:id {slotId}: move to another time (until 2 h before, max 2 times). */
export const PATCH = api(async (req, { params }: RouteContext<"/api/v1/appointments/[id]">) => {
  const me = await caller(req, ["candidate"]);
  const { slotId } = await req.json();
  return rescheduleAppointment(me, (await params).id, slotId);
});

/** DELETE /api/v1/appointments/:id: cancel (no penalty). */
export const DELETE = api(async (req, { params }: RouteContext<"/api/v1/appointments/[id]">) =>
  cancelAppointment(await caller(req, ["candidate"]), (await params).id),
);
