import { api, caller } from "@/lib/api";
import { companyEvents } from "@/lib/services/company";
import { db, events } from "@/db";

/** GET /api/v1/events: City events. Companies also get their own status per event. */
export const GET = api(async (req) => {
  const me = await caller(req);
  return me.role === "company" ? companyEvents(me) : db.select().from(events).orderBy(events.startsAt);
});
