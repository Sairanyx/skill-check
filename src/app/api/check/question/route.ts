import { NextResponse } from "next/server";
import { hasLocale } from "@/i18n/config";
import { getNeed } from "@/lib/demo-data";
import { MAX_TURNS, nextQuestion, type Turn } from "@/lib/ai/interviewer";

// Body: { needId, lang, turns: [{question, answer(pseudonymised)}] }
export async function POST(request: Request) {
  const { needId, lang, turns } = (await request.json()) as { needId: string; lang: string; turns: Turn[] };
  const need = getNeed(needId);
  if (!need || !hasLocale(lang)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (turns.length >= MAX_TURNS) return NextResponse.json({ done: true });
  return NextResponse.json({ done: false, question: await nextQuestion(need, lang, turns), turn: turns.length + 1, max: MAX_TURNS });
}
