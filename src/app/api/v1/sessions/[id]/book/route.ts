import { api, caller } from "@/lib/api";
import { bookSession } from "@/lib/services/sessions";

/** POST /api/v1/sessions/:id/book: candidate reserves a seat. */
export const POST = api(async (req, { params }: RouteContext<"/api/v1/sessions/[id]/book">) =>
  bookSession(await caller(req, ["candidate"]), (await params).id),
);
