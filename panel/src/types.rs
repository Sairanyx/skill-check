//! Shapes stored in Postgres (as JSONB) and sent over the API.
//!
//! Privacy: this service never receives a name, email, CV or audio. The
//! platform pseudonymises every answer (privacy guard) before sending it here,
//! and identifies an interview only by an opaque id.

use serde::{Deserialize, Serialize};

// ── The need (what the company is hiring for) ───────────────────────────────

/// Snapshot of the platform's need, sent once when the interview starts.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Need {
    pub title: String,
    pub company: String,
    #[serde(default)]
    pub company_description: String,
    /// What the person will actually do.
    pub summary: String,
    /// Skills to assess, in the company's order. The report scores each one.
    pub skills: Vec<String>,
    /// "junior" | "mid" | "senior" (free text is fine).
    #[serde(default)]
    pub level: String,
    /// Optional BARS anchors per skill (same shape as the platform's `needs.anchors`).
    #[serde(default)]
    pub anchors: Vec<SkillAnchors>,
    /// Optional company questions for this level, used as starting points.
    #[serde(default)]
    pub question_bank: Vec<String>,
    /// Optional genuine language requirements, e.g. Swedish B2.
    #[serde(default)]
    pub language_requirements: Vec<LanguageRequirement>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SkillAnchors {
    pub skill: String,
    pub anchors: Anchors,
    #[serde(default)]
    pub checklist: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Anchors {
    #[serde(rename = "1")]
    pub one: String,
    #[serde(rename = "3")]
    pub three: String,
    #[serde(rename = "5")]
    pub five: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LanguageRequirement {
    /// "fi" | "sv" | "en"
    pub language: String,
    /// CEFR, e.g. "B2"
    pub level: String,
}

// ── Conversation and deliberation ───────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Turn {
    /// "interviewer" | "candidate"
    pub speaker: String,
    pub text: String,
    /// Candidate turns only, set by the panel: "answer" | "clarifying" | "off_track".
    #[serde(default)]
    pub kind: String,
}

/// One panelist's private memo for a round.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Memo {
    pub panelist: String,
    pub lens: String,
    #[serde(default)]
    pub observations: String,
    #[serde(default)]
    pub signals: Vec<Signal>,
    #[serde(default)]
    pub proposed_question: String,
    #[serde(default)]
    pub why_this_question: String,
    #[serde(default)]
    pub enough_info: bool,
    #[serde(default)]
    pub provisional_score: f64,
    #[serde(default)]
    pub last_message_kind: String,
    #[serde(default)]
    pub inquiry_note: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Signal {
    pub competency: String,
    #[serde(default)]
    pub evidence: String,
    /// "strong" | "some" | "weak" | "none"
    #[serde(default)]
    pub strength: String,
}

/// The panel "talking to each other" for one turn: three independent memos,
/// then the chair's response to them.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PanelRound {
    /// Number of candidate messages this round responds to (0 = opening).
    pub after_turn: usize,
    pub memos: Vec<Memo>,
    pub chair_reasoning: String,
    pub chosen_question: String,
    pub is_done: bool,
    /// How the chair classified the candidate message this round responds to.
    #[serde(default)]
    pub last_message_kind: String,
    /// Set when the code overrode the chair (budget, minimum answers, time).
    #[serde(default)]
    pub enforced: String,
    /// Language code if this round's question was the required-language question.
    #[serde(default)]
    pub language_question: String,
}

// ── Final report ────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PanelVerdict {
    pub panelist: String,
    pub is_person_good: bool,
    pub how_good_or_bad: f64,
    pub reasoning: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SkillScore {
    pub skill: String,
    /// 0–10
    pub score: f64,
    pub reason: String,
    /// The candidate's exact words. Quotes not found in the answers are removed in code.
    #[serde(default)]
    pub quotes: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Report {
    /// The original contract: {is_done, is_person_good, how_good_or_bad}.
    pub is_done: bool,
    /// Majority of the three panelists.
    pub is_person_good: bool,
    /// Mean of the three panel scores, 0 (worst) to 10 (best).
    pub how_good_or_bad: f64,
    pub summary: String,
    pub skills: Vec<SkillScore>,
    pub strengths: Vec<String>,
    pub gaps: Vec<String>,
    pub panel: Vec<PanelVerdict>,
    /// Highest minus lowest panel score (0–10).
    pub disagreement: f64,
    /// 1 − disagreement/10.
    pub agreement: f64,
    /// True when the panel is split (disagreement ≥ 3): worth a closer look.
    pub review_suggested: bool,
    /// How the candidate used questions: clarifying well, fishing, none.
    pub inquiry: String,
    /// What the company should explore face to face.
    pub suggested_conversation: String,
    /// Shown to the candidate, in the interview language. No score.
    pub candidate_feedback: String,
    pub answers: usize,
    pub clarifying: usize,
    pub off_track: usize,
    pub models: Vec<String>,
}

// ── API payloads ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct StartPayload {
    /// Optional: use the platform's own id (e.g. the skill check id). Generated if absent.
    #[serde(default)]
    pub interview_id: Option<String>,
    pub need: Need,
    /// "fi" | "sv" | "en" (other names are passed through to the models).
    pub language: String,
}

#[derive(Deserialize)]
pub struct MessagePayload {
    /// The candidate's message, already pseudonymised by the platform.
    pub text: String,
}

#[derive(Serialize, Clone, Copy)]
pub struct Counts {
    pub answers: usize,
    pub clarifying: usize,
    pub off_track: usize,
    /// Answers + off-track turns used, out of `budget_max`.
    pub budget_used: usize,
    pub budget_max: usize,
}

/// Response to start and to every message.
#[derive(Serialize)]
pub struct StepDto {
    pub interview_id: String,
    /// What the interviewer says next (a question, scenario facts, or the closing thank-you).
    pub message: String,
    /// How the candidate's message was classified. Empty for the opening.
    pub previous_kind: String,
    pub done: bool,
    /// "active" | "reporting" | "done" | "report_failed"
    pub status: String,
    pub counts: Counts,
}

#[derive(Serialize)]
pub struct InterviewDto {
    pub interview_id: String,
    pub language: String,
    pub status: String,
    pub need: Need,
    pub transcript: Vec<Turn>,
    pub counts: Counts,
    pub report: Option<Report>,
    pub report_error: String,
    /// Only with `?deliberation=true` (reviewers, never the candidate).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deliberation: Option<Vec<PanelRound>>,
    pub created_at: f64,
    pub updated_at: f64,
}
