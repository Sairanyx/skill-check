import { api, caller } from "@/lib/api";
import { setEventPolicy } from "@/lib/services/company";

/** PATCH /api/v1/events/:id {checkPolicy: "per_company" | "none"}: City sets whether skill checks apply at all. */
export const PATCH = api(async (req, { params }: RouteContext<"/api/v1/events/[id]">) => {
  const me = await caller(req, ["city"]);
  const { checkPolicy } = await req.json();
  return setEventPolicy(me, (await params).id, checkPolicy === "none" ? "none" : "per_company");
});
