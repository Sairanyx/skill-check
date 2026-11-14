//! SkillCheck booth server: the API under /api (see SERVER_API.md) and the
//! built frontend from ./public. Interviews are JSON files in ./data.
//! No names, emails, CVs or audio are stored: a candidate is an interview id.

mod gemini;
mod panel;

use axum::{
    Json, Router,
    extract::{FromRequest, Path, Request, State, rejection::JsonRejection},
    http::{StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use panel::{Language, Report, Role, Round, Speaker, Turn};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone)]
struct App {
    llm: gemini::Gemini,
    staff_key: Arc<String>,
    data: PathBuf,
    /// Interviews with a message being handled right now.
    busy: Arc<Mutex<HashSet<String>>>,
}

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
enum Status {
    /// Taking messages.
    Active,
    /// Over; verdicts and report being written.
    Reporting,
    Done,
    /// The report couldn't be written. Staff can retry it.
    Failed,
}

#[derive(Serialize, Deserialize, Clone)]
struct Interview {
    id: String,
    role_id: String,
    language: Language,
    status: Status,
    transcript: Vec<Turn>,
    rounds: Vec<Round>,
    report: Option<Report>,
    created_at: f64,
}

fn env(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{name} is not set (run.py sets it)"))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app = App {
        llm: gemini::Gemini::new(env("GEMINI_API_KEY")),
        staff_key: Arc::new(env("STAFF_KEY")),
        data: PathBuf::from(std::env::var("DATA_DIR").unwrap_or_else(|_| "data".into())),
        busy: Arc::default(),
    };
    std::fs::create_dir_all(&app.data)?;
    // Reports that were being written when the server stopped.
    for i in all(&app).into_iter().filter(|i| i.status == Status::Reporting) {
        tokio::spawn(write_report(app.clone(), i.id));
    }

    let staff = Router::new()
        .route("/review", get(review_list))
        .route("/review/{id}", get(review_one))
        .route("/review/{id}/report", post(retry_report))
        .route_layer(middleware::from_fn_with_state(app.clone(), staff_only));
    let api = Router::new()
        .route("/health", get(|| async { Json(json!({ "ok": true })) }))
        .route("/roles", get(|| async { Json(panel::ROLES) }))
        .route("/interviews", post(start))
        .route("/interviews/{id}", get(candidate_view))
        .route("/interviews/{id}/messages", post(message))
        .merge(staff)
        .fallback(|| async { fail(StatusCode::NOT_FOUND, "No such API route") });
    let site = ServeDir::new("public").fallback(ServeFile::new("public/index.html"));
    let router = Router::new().nest("/api", api).fallback_service(site).with_state(app);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8020".into());
    println!("[server] listening on :{port}");
    axum::serve(tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?, router).await?;
    Ok(())
}

// ── storage: one JSON file per interview ────────────────────────────────────

fn path(app: &App, id: &str) -> Option<PathBuf> {
    // Ids are ULIDs; anything else never touches the filesystem.
    (id.len() == 26 && id.chars().all(|c| c.is_ascii_alphanumeric())).then(|| app.data.join(format!("{id}.json")))
}

fn load(app: &App, id: &str) -> Res<Interview> {
    path(app, id)
        .and_then(|p| std::fs::read(p).ok())
        .and_then(|b| serde_json::from_slice(&b).ok())
        .ok_or_else(|| fail(StatusCode::NOT_FOUND, "Interview not found"))
}

fn save(app: &App, i: &Interview) -> Res<()> {
    let p = path(app, &i.id).ok_or_else(|| fail(StatusCode::BAD_REQUEST, "Bad id"))?;
    let tmp = p.with_extension("tmp");
    std::fs::write(&tmp, serde_json::to_vec(i).unwrap())
        .and_then(|_| std::fs::rename(&tmp, &p))
        .map_err(|e| fail(StatusCode::INTERNAL_SERVER_ERROR, format!("Could not save: {e}")))
}

fn all(app: &App) -> Vec<Interview> {
    let mut v: Vec<Interview> = std::fs::read_dir(&app.data)
        .into_iter()
        .flatten()
        .flatten()
        // Only finished writes: a leftover .tmp would show up twice.
        .filter(|e| e.path().extension().is_some_and(|x| x == "json"))
        .filter_map(|e| serde_json::from_slice(&std::fs::read(e.path()).ok()?).ok())
        .collect();
    v.sort_by(|a, b| b.created_at.total_cmp(&a.created_at));
    v
}

// ── errors and helpers ──────────────────────────────────────────────────────

struct Fail(StatusCode, String);
type Res<T> = Result<T, Fail>;

impl IntoResponse for Fail {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

fn fail(code: StatusCode, msg: impl Into<String>) -> Fail {
    Fail(code, msg.into())
}

/// Malformed or invalid bodies get the same `{"error": …}` shape as everything else.
impl From<JsonRejection> for Fail {
    fn from(e: JsonRejection) -> Self {
        fail(StatusCode::BAD_REQUEST, e.body_text())
    }
}

/// `Json`, but rejections are a `Fail`.
#[derive(FromRequest)]
#[from_request(via(Json), rejection(Fail))]
struct Body<T>(T);

fn role(id: &str) -> Res<&'static Role> {
    panel::role(id).ok_or_else(|| fail(StatusCode::NOT_FOUND, "Role not found"))
}

/// The panel couldn't finish (after retrying the same models). Nothing was
/// stored, so the candidate can simply send the same message again.
fn panel_failed(e: anyhow::Error) -> Fail {
    eprintln!("[server] panel failed: {e:#}");
    fail(StatusCode::SERVICE_UNAVAILABLE, "The interviewer couldn't answer just now. Send the same message again.")
}

fn now() -> f64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs_f64()).unwrap_or(0.0)
}

async fn staff_only(State(app): State<App>, req: Request, next: Next) -> Response {
    let key = req.headers().get(header::AUTHORIZATION).and_then(|v| v.to_str().ok()).and_then(|v| v.strip_prefix("Bearer "));
    if key == Some(app.staff_key.as_str()) { next.run(req).await } else { fail(StatusCode::UNAUTHORIZED, "Staff key missing or wrong").into_response() }
}

/// One message at a time per interview (a double-click gets 409).
struct Busy(App, String);

impl Busy {
    fn take(app: &App, id: &str) -> Res<Busy> {
        if app.busy.lock().unwrap().insert(id.into()) { Ok(Busy(app.clone(), id.into())) } else { Err(fail(StatusCode::CONFLICT, "Still thinking about the previous message")) }
    }
}

impl Drop for Busy {
    fn drop(&mut self) {
        self.0.busy.lock().unwrap().remove(&self.1);
    }
}

// ── candidate routes ────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct StartBody {
    role_id: String,
    language: Language,
}

#[derive(Deserialize)]
struct MessageBody {
    text: String,
}

/// What the candidate's screen gets: the next message, nothing about the panel.
#[derive(Serialize)]
struct Step {
    id: String,
    message: String,
    done: bool,
}

async fn start(State(app): State<App>, Body(b): Body<StartBody>) -> Res<(StatusCode, Json<Step>)> {
    let role = role(&b.role_id)?;
    let step = panel::next_turn(&app.llm, role, &[], &[], b.language).await.map_err(panel_failed)?;
    let i = Interview {
        id: ulid::Ulid::generate().to_string(),
        role_id: role.id.into(),
        language: b.language,
        status: Status::Active,
        transcript: vec![Turn::new(Speaker::Interviewer, step.message.clone())],
        rounds: vec![step.round],
        report: None,
        created_at: now(),
    };
    save(&app, &i)?;
    Ok((StatusCode::CREATED, Json(Step { id: i.id, message: step.message, done: false })))
}

async fn message(State(app): State<App>, Path(id): Path<String>, Body(b): Body<MessageBody>) -> Res<Json<Step>> {
    let text = b.text.trim().to_string();
    if text.is_empty() || text.chars().count() > 8000 {
        return Err(fail(StatusCode::BAD_REQUEST, "The message must be 1-8000 characters"));
    }
    let _busy = Busy::take(&app, &id)?;
    let mut i = load(&app, &id)?;
    if i.status != Status::Active {
        return Err(fail(StatusCode::CONFLICT, "This interview is finished"));
    }
    let role = role(&i.role_id)?;

    // Stored only once the panel has answered, so a 503 leaves nothing behind.
    i.transcript.push(Turn::new(Speaker::Candidate, text));
    let step = panel::next_turn(&app.llm, role, &i.transcript, &i.rounds, i.language).await.map_err(panel_failed)?;

    i.transcript.last_mut().unwrap().kind = step.kind;
    i.transcript.push(Turn::new(Speaker::Interviewer, step.message.clone()));
    let done = step.round.is_done;
    i.rounds.push(step.round);
    if done {
        i.status = Status::Reporting;
    }
    save(&app, &i)?;
    if done {
        tokio::spawn(write_report(app.clone(), id.clone()));
    }
    Ok(Json(Step { id, message: step.message, done }))
}

/// The verdicts and report take a minute or two, so they run after the
/// candidate's last message has been answered.
async fn write_report(app: App, id: String) {
    let Ok(mut i) = load(&app, &id) else { return };
    let result = match role(&i.role_id) {
        Ok(role) => panel::report(&app.llm, role, &i.transcript, i.language).await,
        Err(Fail(_, e)) => Err(anyhow::anyhow!(e)),
    };
    match result {
        Ok(r) => {
            i.report = Some(r);
            i.status = Status::Done;
        }
        Err(e) => {
            eprintln!("[server] report {id} failed: {e:#}");
            i.status = Status::Failed;
        }
    }
    let _ = save(&app, &i);
}

/// The candidate's own view: the conversation, and feedback once ready.
async fn candidate_view(State(app): State<App>, Path(id): Path<String>) -> Res<Json<serde_json::Value>> {
    let i = load(&app, &id)?;
    let transcript: Vec<_> = i.transcript.iter().map(|t| json!({ "speaker": t.speaker, "text": t.text })).collect();
    Ok(Json(json!({
        "id": i.id,
        "role": panel::role(&i.role_id),
        "status": i.status,
        "transcript": transcript,
        "feedback": i.report.map(|r| r.candidate_feedback),
    })))
}

// ── staff routes ────────────────────────────────────────────────────────────

async fn review_list(State(app): State<App>) -> Json<Vec<serde_json::Value>> {
    Json(
        all(&app)
            .into_iter()
            .map(|i| {
                let r = i.report.as_ref();
                json!({
                    "id": i.id,
                    "role_id": i.role_id,
                    "status": i.status,
                    "score": r.map(|r| r.how_good_or_bad),
                    "is_person_good": r.map(|r| r.is_person_good),
                    "disagreement": r.map(|r| r.disagreement),
                    "created_at": i.created_at,
                })
            })
            .collect(),
    )
}

async fn review_one(State(app): State<App>, Path(id): Path<String>) -> Res<Json<Interview>> {
    load(&app, &id).map(Json)
}

/// Writes a failed report again. It's ready when the interview is `done`.
async fn retry_report(State(app): State<App>, Path(id): Path<String>) -> Res<StatusCode> {
    let _busy = Busy::take(&app, &id)?; // two clicks must not start two reports
    let mut i = load(&app, &id)?;
    if i.status != Status::Failed {
        return Err(fail(StatusCode::CONFLICT, "Only a failed report can be retried"));
    }
    i.status = Status::Reporting;
    save(&app, &i)?;
    tokio::spawn(write_report(app.clone(), id));
    Ok(StatusCode::ACCEPTED)
}
