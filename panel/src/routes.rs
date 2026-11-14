//! HTTP API. Contract: docs/PANEL_API.md. Every /v1 route needs
//! `Authorization: Bearer $PANEL_API_KEY`; only the platform's server calls it.

use crate::{AppState, db, panel, prompt, types::*};
use axum::{
    Json, Router,
    extract::{Path, Query, Request, State},
    http::{StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::Deserialize;
use serde_json::json;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct ApiError(StatusCode, String);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(e: sqlx::Error) -> Self {
        eprintln!("[panel] db: {e}");
        ApiError(StatusCode::INTERNAL_SERVER_ERROR, "Database error".into())
    }
}

fn err(code: StatusCode, msg: impl Into<String>) -> ApiError {
    ApiError(code, msg.into())
}

/// The panel couldn't finish thinking (after retries on the same models).
/// Nothing was stored, so the same message can simply be sent again.
fn panel_err(e: anyhow::Error) -> ApiError {
    eprintln!("[panel] deliberation failed: {e:#}");
    err(StatusCode::SERVICE_UNAVAILABLE, "The panel couldn't finish thinking. Send the same message again.")
}

type Res<T> = Result<T, ApiError>;

pub fn router(state: AppState) -> Router {
    let v1 = Router::new()
        .route("/interviews", post(start))
        .route("/interviews/{id}", get(read).delete(erase))
        .route("/interviews/{id}/messages", post(message))
        .route("/interviews/{id}/report", post(retry_report))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth));
    Router::new()
        .route("/health", get(|| async { Json(json!({ "ok": true })) }))
        .nest("/v1", v1)
        .with_state(state)
}

async fn auth(State(s): State<AppState>, req: Request, next: Next) -> Response {
    let ok = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .is_some_and(|t| constant_eq(t.as_bytes(), s.api_key.as_bytes()));
    if ok { next.run(req).await } else { err(StatusCode::UNAUTHORIZED, "Missing or wrong API key").into_response() }
}

fn constant_eq(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

fn now() -> f64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs_f64()).unwrap_or(0.0)
}

fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 64 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// One request at a time per interview: a double-click or a client retry
/// while the panel is still thinking gets 409 instead of a second deliberation.
struct Busy(AppState, String);

impl Busy {
    fn take(s: &AppState, id: &str) -> Res<Busy> {
        if s.busy.lock().unwrap().insert(id.to_string()) {
            Ok(Busy(s.clone(), id.to_string()))
        } else {
            Err(err(StatusCode::CONFLICT, "The panel is still thinking about the previous message"))
        }
    }
}

impl Drop for Busy {
    fn drop(&mut self) {
        self.0.busy.lock().unwrap().remove(&self.1);
    }
}

fn step_dto(row_id: &str, transcript: &[Turn], status: &str) -> StepDto {
    let last_interviewer = transcript.iter().rev().find(|t| t.speaker == "interviewer");
    let last_candidate = transcript.iter().rev().find(|t| t.speaker == "candidate");
    StepDto {
        interview_id: row_id.to_string(),
        message: last_interviewer.map(|t| t.text.clone()).unwrap_or_default(),
        previous_kind: last_candidate.map(|t| t.kind.clone()).unwrap_or_default(),
        done: status != db::ACTIVE,
        status: status.to_string(),
        counts: prompt::Budget::from(transcript, 0.0).counts(),
    }
}

// ── POST /v1/interviews ─────────────────────────────────────────────────────

async fn start(State(s): State<AppState>, Json(p): Json<StartPayload>) -> Res<(StatusCode, Json<StepDto>)> {
    let id = p.interview_id.clone().unwrap_or_else(|| ulid::Ulid::generate().to_string());
    if !valid_id(&id) {
        return Err(err(StatusCode::BAD_REQUEST, "interview_id: 1-64 characters, letters, digits, - or _"));
    }
    let n = &p.need;
    if n.title.trim().is_empty() || n.company.trim().is_empty() || n.summary.trim().is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "need.title, need.company and need.summary are required"));
    }
    if n.skills.iter().all(|x| x.trim().is_empty()) {
        return Err(err(StatusCode::BAD_REQUEST, "need.skills needs at least one skill"));
    }
    let language = p.language.trim().to_string();
    if language.is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "language is required (fi, sv or en)"));
    }

    let _busy = Busy::take(&s, &id)?;
    // Idempotent: starting the same id again returns where it is.
    if let Some(row) = db::get(&s.db, &id).await? {
        return Ok((StatusCode::OK, Json(step_dto(&id, &row.transcript.0, &row.status))));
    }

    let step = panel::deliberate(&s.llm, n, &[], &[], &language, 0.0).await.map_err(panel_err)?;
    let transcript = vec![Turn { speaker: "interviewer".into(), text: step.message, kind: String::new() }];
    db::insert(&s.db, &id, n, &language, &transcript, &[step.round]).await?;
    Ok((StatusCode::CREATED, Json(step_dto(&id, &transcript, db::ACTIVE))))
}

// ── POST /v1/interviews/{id}/messages ───────────────────────────────────────

const MAX_MESSAGE_CHARS: usize = 8000;

async fn message(State(s): State<AppState>, Path(id): Path<String>, Json(p): Json<MessagePayload>) -> Res<Json<StepDto>> {
    let text = p.text.trim().to_string();
    if text.is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "Empty message"));
    }
    if text.chars().count() > MAX_MESSAGE_CHARS {
        return Err(err(StatusCode::PAYLOAD_TOO_LARGE, format!("Message longer than {MAX_MESSAGE_CHARS} characters")));
    }
    let _busy = Busy::take(&s, &id)?;
    let row = db::get(&s.db, &id).await?.ok_or_else(|| err(StatusCode::NOT_FOUND, "Interview not found"))?;
    if row.status != db::ACTIVE {
        return Err(err(StatusCode::CONFLICT, "This interview is finished"));
    }

    let mut transcript = row.transcript.0;
    let mut rounds = row.deliberation.0;
    transcript.push(Turn { speaker: "candidate".into(), text, kind: String::new() });
    let minutes = (now() - row.created_at).max(0.0) / 60.0;

    let step = panel::deliberate(&s.llm, &row.need.0, &transcript, &rounds, &row.language, minutes)
        .await
        .map_err(panel_err)?;

    if let Some(last) = transcript.last_mut() {
        last.kind = step.kind.clone();
    }
    let done = step.round.is_done;
    transcript.push(Turn { speaker: "interviewer".into(), text: step.message, kind: String::new() });
    rounds.push(step.round);
    let status = if done { db::REPORTING } else { db::ACTIVE };
    db::save_turn(&s.db, &id, &transcript, &rounds, status).await?;
    if done {
        spawn_report(s.clone(), id.clone());
    }
    Ok(Json(step_dto(&id, &transcript, status)))
}

/// The final report takes a minute or two (three verdicts + the report, all on
/// high thinking), so it runs after the candidate's last turn has returned.
pub fn spawn_report(s: AppState, id: String) {
    tokio::spawn(async move {
        let Ok(Some(row)) = db::get(&s.db, &id).await else { return };
        let result = panel::final_report(&s.llm, &row.need.0, &row.transcript.0, &row.language).await;
        let saved = match &result {
            Ok(r) => db::save_report(&s.db, &id, Some(r), "").await,
            Err(e) => {
                eprintln!("[panel] report {id} failed: {e:#}");
                db::save_report(&s.db, &id, None, "The panel couldn't finish the report. Retry with POST /report.").await
            }
        };
        if let Err(e) = saved {
            eprintln!("[panel] saving report {id}: {e}");
        }
    });
}

// ── POST /v1/interviews/{id}/report ─────────────────────────────────────────

async fn retry_report(State(s): State<AppState>, Path(id): Path<String>) -> Res<(StatusCode, Json<serde_json::Value>)> {
    let row = db::get(&s.db, &id).await?.ok_or_else(|| err(StatusCode::NOT_FOUND, "Interview not found"))?;
    match row.status.as_str() {
        db::ACTIVE => Err(err(StatusCode::CONFLICT, "The interview is still going")),
        db::DONE => Ok((StatusCode::OK, Json(json!({ "status": db::DONE })))),
        db::REPORTING => Ok((StatusCode::ACCEPTED, Json(json!({ "status": db::REPORTING })))),
        _ => {
            db::set_status(&s.db, &id, db::REPORTING).await?;
            spawn_report(s.clone(), id);
            Ok((StatusCode::ACCEPTED, Json(json!({ "status": db::REPORTING }))))
        }
    }
}

// ── GET /v1/interviews/{id} ─────────────────────────────────────────────────

#[derive(Deserialize)]
struct ReadQuery {
    #[serde(default)]
    deliberation: bool,
}

async fn read(State(s): State<AppState>, Path(id): Path<String>, Query(q): Query<ReadQuery>) -> Res<Json<InterviewDto>> {
    let row = db::get(&s.db, &id).await?.ok_or_else(|| err(StatusCode::NOT_FOUND, "Interview not found"))?;
    Ok(Json(InterviewDto {
        counts: prompt::Budget::from(&row.transcript.0, 0.0).counts(),
        interview_id: row.interview_id,
        language: row.language,
        status: row.status,
        need: row.need.0,
        transcript: row.transcript.0,
        report: row.report.map(|r| r.0),
        report_error: row.report_error,
        deliberation: q.deliberation.then_some(row.deliberation.0),
        created_at: row.created_at,
        updated_at: row.updated_at,
    }))
}

// ── DELETE /v1/interviews/{id} ──────────────────────────────────────────────

/// GDPR erasure and retention: the platform calls this when it deletes the check.
async fn erase(State(s): State<AppState>, Path(id): Path<String>) -> Res<StatusCode> {
    let _busy = Busy::take(&s, &id)?;
    if db::delete(&s.db, &id).await? { Ok(StatusCode::NO_CONTENT) } else { Err(err(StatusCode::NOT_FOUND, "Interview not found")) }
}
