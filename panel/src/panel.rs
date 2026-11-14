//! The deliberation loop. After every candidate message:
//!   1. all three panelists write a private memo IN PARALLEL (independent views),
//!      including how they read the message: answer, clarifying question, or
//!      off-track (fishing / stalling / manipulation);
//!   2. the chair reads all three memos, makes the call on that classification,
//!      replies to the panel, and either continues or ends the interview.
//! The code then enforces the budget (see prompt.rs) on the chair's decision.
//! When it ends, the three give independent final verdicts in parallel and the
//! chair writes the evidence report.
//!
//! Quality rule: every judgement comes from the Gemini 4 panel. There is no
//! fallback to a weaker model and no dropping a panelist. If a call fails it's
//! retried on the same model; if it still fails the turn fails and the
//! candidate simply sends their answer again.

use crate::gemini::{Gemini, StreamError};
use crate::prompt::*;
use crate::types::*;
use serde_json::Value;
use std::time::Duration;

// Thinking levels. Higher where a mistake costs the most.
const MEMO_THINKING: &str = "MEDIUM";
const CHAIR_THINKING: &str = "MEDIUM";
const VERDICT_THINKING: &str = "HIGH";
const REPORT_THINKING: &str = "HIGH";

/// A thinking model sends a thought summary every second or two. This long
/// with no bytes at all means the request is stuck, not thinking.
const STALL_AFTER: Duration = Duration::from_secs(30);
const ATTEMPTS: u32 = 3;

async fn call(llm: &Gemini, model: &str, system: &str, task: &str, schema: &Value, level: &str) -> anyhow::Result<Value> {
    let mut last = String::new();
    for attempt in 1..=ATTEMPTS {
        match llm.json(model, system, task, schema, level, STALL_AFTER).await {
            Ok(v) => return Ok(v),
            Err(StreamError::Fatal(e)) => anyhow::bail!("{model}: {e}"),
            Err(e) => {
                eprintln!("[panel] {model} attempt {attempt}/{ATTEMPTS}: {e}");
                last = e.to_string();
                // Back off for rate limits and server errors; a stall retries right away.
                if attempt < ATTEMPTS && !matches!(e, StreamError::Stalled(_)) {
                    tokio::time::sleep(Duration::from_millis(1500 * attempt as u64)).await;
                }
            }
        }
    }
    anyhow::bail!("{model} failed {ATTEMPTS} times: {last}")
}

fn s(v: &Value, k: &str) -> String {
    v[k].as_str().unwrap_or_default().trim().to_string()
}

fn strs(v: &Value) -> Vec<String> {
    v.as_array()
        .map(|a| a.iter().filter_map(|x| x.as_str()).map(|x| x.trim().to_string()).filter(|x| !x.is_empty()).collect())
        .unwrap_or_default()
}

/// Run one call per panelist concurrently. The panel is a fixed three.
async fn on_panel<F, Fut, T>(f: F) -> Vec<T>
where
    F: Fn(&'static Panelist) -> Fut,
    Fut: std::future::Future<Output = T>,
{
    let (a, b, c) = tokio::join!(f(&PANEL[0]), f(&PANEL[1]), f(&PANEL[2]));
    vec![a, b, c]
}

fn normalise_kind(k: &str) -> String {
    match k {
        KIND_ANSWER | KIND_CLARIFYING | KIND_OFF_TRACK => k.to_string(),
        _ => String::new(),
    }
}

/// The required-language question still to be asked, if any.
pub fn pending_language<'a>(need: &'a Need, language: &str, rounds: &[PanelRound]) -> Option<&'a LanguageRequirement> {
    need.language_requirements
        .iter()
        .find(|r| r.language != language && !rounds.iter().any(|x| x.language_question == r.language))
}

pub struct Step {
    pub round: PanelRound,
    pub message: String,
    /// Classification of the candidate message this step responded to.
    pub kind: String,
}

/// `t` ends with the candidate's newest (unclassified) message, or is empty for
/// the opening question.
pub async fn deliberate(llm: &Gemini, need: &Need, t: &[Turn], rounds: &[PanelRound], language: &str, minutes: f64) -> anyhow::Result<Step> {
    let first = t.is_empty();
    let history = if first { t } else { &t[..t.len() - 1] };
    let before = Budget::from(history, minutes);
    let lang_name = language_name(language);
    let task = memo_task(need, t, lang_name, &before);

    let results = on_panel(|p| {
        let task = &task;
        async move { (p, call(llm, p.model, &panelist_system(p), task, &memo_schema(), p.level(MEMO_THINKING)).await) }
    })
    .await;

    let mut memos = Vec::with_capacity(3);
    for (p, v) in results {
        let v = v?; // no partial panels
        let mut m: Memo = serde_json::from_value(serde_json::json!({
            "panelist": p.name, "lens": p.lens,
            "observations": v["observations"], "signals": v["signals"],
            "proposed_question": v["proposed_question"], "why_this_question": v["why_this_question"],
            "enough_info": v["enough_info"], "provisional_score": v["provisional_score"],
            "last_message_kind": v["last_message_kind"],
            "inquiry_note": v["inquiry_note"],
        }))?;
        m.provisional_score = m.provisional_score.clamp(0.0, 10.0);
        memos.push(m);
    }

    // Hard limits that hold no matter how this message is classified.
    let hard_stop = !first && (minutes >= MAX_MINUTES || before.messages + 1 >= MAX_MESSAGES);
    let mut enforced = if hard_stop {
        format!("hard stop ({minutes:.0} min, {} messages)", before.messages + 1)
    } else {
        String::new()
    };

    // The required-language question is placed by code, from the third question on.
    let pending_lang = pending_language(need, language, rounds);
    let lang_due = pending_lang.filter(|_| !first && before.answers + 1 >= LANGUAGE_QUESTION_AFTER);

    let chair_call = |c: Constraint, lang: Option<&LanguageRequirement>| {
        let task = chair_task(need, t, &memos, lang_name, &before, c, lang);
        async move { call(llm, CHAIR.model, &chair_system(), &task, &chair_schema(), CHAIR.level(CHAIR_THINKING)).await }
    };
    let mut chair = chair_call(if hard_stop { Constraint::MustFinish } else { Constraint::Free }, lang_due).await?;

    // Unclassifiable → treat as an answer: the conservative reading for budget.
    let kind = match (first, normalise_kind(&s(&chair, "last_message_kind"))) {
        (true, _) => String::new(),
        (false, k) if k.is_empty() => KIND_ANSWER.to_string(),
        (false, k) => k,
    };
    let answers_now = before.answers + (kind == KIND_ANSWER) as usize;
    let used_now = before.used() + (kind == KIND_ANSWER || kind == KIND_OFF_TRACK) as usize;
    let mut is_done = chair["is_done"].as_bool().unwrap_or(false);

    // Enforce the rules on the chair's call. If it broke one, ask it again with
    // the rule as a hard constraint so its words match the decision.
    if hard_stop {
        is_done = true;
    } else if first && is_done {
        chair = chair_call(Constraint::MustContinue, None).await?;
        is_done = false;
    } else if !first && used_now >= MAX_BUDGET && !is_done {
        enforced = format!("budget reached ({used_now}/{MAX_BUDGET})");
        chair = chair_call(Constraint::MustFinish, None).await?;
        is_done = true;
    } else if is_done && used_now < MAX_BUDGET && (answers_now < MIN_ANSWERS || pending_lang.is_some()) {
        enforced = if answers_now < MIN_ANSWERS {
            format!("only {answers_now} of {MIN_ANSWERS} required answers")
        } else {
            "required-language question not asked yet".to_string()
        };
        chair = chair_call(Constraint::MustContinue, pending_lang).await?;
        is_done = false;
    }

    let mut message = s(&chair, "message_to_candidate");
    if message.is_empty() {
        message = memos[0].proposed_question.clone();
    }
    let language_question = match pending_lang {
        Some(r) if !is_done && chair["language_question"].as_bool().unwrap_or(false) => r.language.clone(),
        _ => String::new(),
    };

    Ok(Step {
        round: PanelRound {
            after_turn: history.iter().filter(|t| t.speaker == "candidate").count() + (!first) as usize,
            memos,
            chair_reasoning: s(&chair, "reasoning_to_panel"),
            chosen_question: message.clone(),
            is_done,
            last_message_kind: kind.clone(),
            enforced,
            language_question,
        },
        message,
        kind,
    })
}

fn norm(s: &str) -> String {
    s.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '[' || c == ']' { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub async fn final_report(llm: &Gemini, need: &Need, t: &[Turn], language: &str) -> anyhow::Result<Report> {
    let task = verdict_task(need, t);
    let results = on_panel(|p| {
        let task = &task;
        async move { (p, call(llm, p.model, &panelist_system(p), task, &verdict_schema(), p.level(VERDICT_THINKING)).await) }
    })
    .await;

    let mut verdicts = Vec::with_capacity(3);
    for (p, v) in results {
        let v = v?; // all three verdicts or none
        verdicts.push(PanelVerdict {
            panelist: p.name.into(),
            is_person_good: v["is_person_good"].as_bool().unwrap_or(false),
            how_good_or_bad: v["how_good_or_bad"].as_f64().unwrap_or(0.0).clamp(0.0, 10.0),
            reasoning: s(&v, "reasoning"),
        });
    }

    let r = call(llm, CHAIR.model, &chair_system(), &report_task(need, t, &verdicts, language_name(language)), &report_schema(), CHAIR.level(REPORT_THINKING)).await?;

    let scores: Vec<f64> = verdicts.iter().map(|v| v.how_good_or_bad).collect();
    let mean = scores.iter().sum::<f64>() / scores.len() as f64;
    let hi = scores.iter().cloned().fold(f64::MIN, f64::max);
    let lo = scores.iter().cloned().fold(f64::MAX, f64::min);
    let disagreement = ((hi - lo) * 10.0).round() / 10.0;
    let good_votes = verdicts.iter().filter(|v| v.is_person_good).count();
    let b = Budget::from(t, 0.0);

    // Skills: exactly the company's, in its order. Quotes must really be in the answers.
    let said = norm(&t.iter().filter(|x| x.speaker == "candidate").map(|x| x.text.as_str()).collect::<Vec<_>>().join("\n"));
    let out: Vec<Value> = r["skills"].as_array().cloned().unwrap_or_default();
    let skills = need
        .skills
        .iter()
        .map(|name| {
            let found = out.iter().find(|x| s(x, "skill").eq_ignore_ascii_case(name));
            let quotes: Vec<String> = found
                .map(|x| strs(&x["quotes"]))
                .unwrap_or_default()
                .into_iter()
                .filter(|q| !norm(q).is_empty() && said.contains(&norm(q)))
                .collect();
            SkillScore {
                skill: name.clone(),
                score: found.and_then(|x| x["score"].as_f64()).unwrap_or(0.0).clamp(0.0, 10.0),
                reason: found.map(|x| s(x, "reason")).unwrap_or_else(|| "Not shown in the answers.".into()),
                quotes,
            }
        })
        .collect();

    Ok(Report {
        is_done: true,
        is_person_good: good_votes * 2 > verdicts.len(),
        how_good_or_bad: (mean * 10.0).round() / 10.0,
        summary: s(&r, "summary"),
        skills,
        strengths: strs(&r["strengths"]),
        gaps: strs(&r["gaps"]),
        agreement: ((1.0 - disagreement / 10.0) * 100.0).round() / 100.0,
        review_suggested: disagreement >= 3.0,
        disagreement,
        panel: verdicts,
        inquiry: s(&r, "inquiry"),
        suggested_conversation: s(&r, "suggested_conversation"),
        candidate_feedback: s(&r, "candidate_feedback"),
        answers: b.answers,
        clarifying: b.clarifying,
        off_track: b.off_track,
        models: PANEL.iter().map(|p| p.model.to_string()).collect(),
    })
}
