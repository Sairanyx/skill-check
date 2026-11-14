import { NextResponse } from "next/server";
import { getNeed } from "@/lib/demo-data";
import { evaluate } from "@/lib/ai/evaluator";
import type { Turn } from "@/lib/ai/interviewer";

// Body: { needId, turns } — turns contain pseudonymised answers only.
export async function POST(request: Request) {
  const { needId, turns } = (await request.json()) as { needId: string; turns: Turn[] };
  const need = getNeed(needId);
  if (!need || !turns?.length) return NextResponse.json({ error: "bad request" }, { status: 400 });
  return NextResponse.json(await evaluate(need, turns));
}
