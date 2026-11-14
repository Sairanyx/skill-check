import "server-only";
import type { Need } from "@/lib/demo-data";
import type { LanguageResult } from "@/db/schema";

/**
 * Client for the interview panel service (`panel/`, contract in docs/PANEL_API.md).
 * The panel runs the whole interview and the assessment with its own instructions; the platform
 * only passes the need and the candidate's pseudonymised words (`seen`). Requires PANEL_URL and PANEL_API_KEY.
 */

export type PanelStep = { interview_id: string; message: string; previous_kind: string; done: boolean; status: string };
export type PanelReport = {
  is_person_good: boolean;
  how_good_or_bad: number;
  summary: string;
  skills: { skill: string; score: number; reason: string; quotes: string[] }[];
  strengths: string[];
  gaps: string[];
  panel: { panelist: string; is_person_good: boolean; how_good_or_bad: number; reasoning: string }[];
  disagreement: number;
  agreement: number;
  review_suggested: boolean;
  inquiry: string;
  suggested_conversation: string;
  candidate_feedback: string;
  answers: number;
  clarifying: number;
  off_track: number;
  languages: LanguageResult[];
  models: string[];
};
type PanelInterview = { status: string; report: PanelReport | null; report_error: string };

class PanelError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const isPanelError = (e: unknown): e is PanelError => e instanceof PanelError;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!process.env.PANEL_URL || !process.env.PANEL_API_KEY) throw new Error("PANEL_URL and PANEL_API_KEY must be set");
  const res = await fetch(`${process.env.PANEL_URL}/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.PANEL_API_KEY}` },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5 * 60_000), // three models think before every question
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PanelError(res.status, (data as { error?: string }).error ?? `Panel failed (${res.status})`);
  return data as T;
}

const needForPanel = (need: Need) => ({
  title: need.title,
  company: need.company,
  company_description: need.companyDescription ?? "",
  summary: need.summary,
  skills: need.skills,
  level: need.level,
  anchors: need.anchors ?? [],
  question_bank: need.questionBank?.[need.level]?.filter(Boolean) ?? [],
  language_requirements: (need.languageRequirements ?? []).map((r) => ({ language: r.language, level: r.level })),
});

export const panelStart = (interviewId: string, need: Need, language: string) =>
  call<PanelStep>("POST", "/interviews", { interview_id: interviewId, need: needForPanel(need), language });

export const panelMessage = (interviewId: string, seen: string) => call<PanelStep>("POST", `/interviews/${interviewId}/messages`, { text: seen });

export const panelErase = (interviewId: string) => call<void>("DELETE", `/interviews/${interviewId}`).catch((e) => {
  if (!isPanelError(e) || e.status !== 404) throw e;
});

/** Wait for the final report (the panel writes it in the background, usually 1–2 minutes). */
export async function panelReport(interviewId: string, maxWaitMs = 6 * 60_000): Promise<PanelReport> {
  const until = Date.now() + maxWaitMs;
  let retried = false;
  for (;;) {
    const r = await call<PanelInterview>("GET", `/interviews/${interviewId}`);
    if (r.status === "done" && r.report) return r.report;
    if (r.status === "report_failed") {
      if (retried) throw new Error(r.report_error || "The panel could not write the report");
      retried = true;
      await call("POST", `/interviews/${interviewId}/report`);
    }
    if (Date.now() > until) throw new Error("The panel report took too long");
    await new Promise((ok) => setTimeout(ok, 5000));
  }
}

/** The panel report in the shape of the platform's `evaluations` row. */
export function panelEvaluation(r: PanelReport) {
  const mean = r.skills.filter((s) => s.score > 0).reduce((a, s, _, xs) => a + s.score / xs.length, 0);
  return {
    match: r.how_good_or_bad,
    level: (mean >= 8 ? "senior" : mean >= 5 ? "mid" : "junior") as "junior" | "mid" | "senior",
    confidence: r.agreement,
    rubric: r.skills.map((s) => ({ criterion: s.skill, score: s.score, evidence: s.quotes, reason: s.reason, checklist: [] as string[] })),
    strengths: r.strengths,
    gaps: r.gaps,
    fairness: { flags: [] as string[], note: r.inquiry },
    model: `Panel: ${r.models.join(" + ")}`,
    method: {
      engine: "panel",
      verdicts: r.panel,
      is_person_good: r.is_person_good,
      disagreement: r.disagreement,
      agreement: r.agreement,
      answers: r.answers,
      clarifying: r.clarifying,
      off_track: r.off_track,
      summary: r.summary,
      suggested_conversation: r.suggested_conversation,
      candidate_feedback: r.candidate_feedback,
    },
    language: r.languages,
    reviewSuggested: r.review_suggested,
  };
}
