import { api, caller } from "@/lib/api";
import { mySessions } from "@/lib/services/sessions";

/** GET /api/v1/me/sessions: my booked sessions. */
export const GET = api(async (req) => mySessions(await caller(req, ["candidate"])));
