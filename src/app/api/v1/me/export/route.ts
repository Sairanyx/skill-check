import { api, caller } from "@/lib/api";
import { exportMyData } from "@/lib/services/privacy";

/** GET /api/v1/me/export: GDPR right of access / portability. All my data as JSON. */
export const GET = api(async (req) => exportMyData(await caller(req, ["candidate"])));
