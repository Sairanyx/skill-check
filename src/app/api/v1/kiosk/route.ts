import { api } from "@/lib/api";
import { kioskStatus, kioskTokenFromRequest } from "@/lib/services/testing";

/** GET /api/v1/kiosk: is this browser a City workstation, and is it reserved right now? (no names) */
export const GET = api(async (req) => (await kioskStatus(kioskTokenFromRequest(req))) ?? { kiosk: false });
