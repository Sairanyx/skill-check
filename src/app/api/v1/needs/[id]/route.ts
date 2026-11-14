import { api, caller } from "@/lib/api";
import { updateNeedSettings } from "@/lib/services/company";

/** PATCH /api/v1/needs/:id {checkMode?, questionBank?, languageRequirements?, proofRequirements?, anchors?}: company edits its need. Questions and anchors are screened for bias. */
export const PATCH = api(async (req, { params }: RouteContext<"/api/v1/needs/[id]">) =>
  updateNeedSettings(await caller(req, ["company"]), (await params).id, await req.json()),
);
