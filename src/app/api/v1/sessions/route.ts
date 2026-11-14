import { api, caller } from "@/lib/api";
import { createSession, listSessions } from "@/lib/services/sessions";

/** GET /api/v1/sessions: skill-check sessions run by the City (no room codes). */
export const GET = api(async (req) => {
  await caller(req);
  return listSessions();
});

/** POST /api/v1/sessions {title, mode, venue, room, startsAt, endsAt, capacity}: City creates a session. */
export const POST = api(async (req) => createSession(await caller(req, ["city"]), await req.json()));
