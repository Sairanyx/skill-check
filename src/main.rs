//! SkillCheck booth server: the API under /api (see SERVER_API.md) and the
//! built frontend from ./public. Interviews are JSON files in ./data.
//! No names, emails, CVs or audio are stored: a candidate is an interview id.

mod gemini;
mod panel;
mod roles;

use axum::{
    Json, Router,
    extract::{FromRequest, Path, State, rejection::JsonRejection},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
};
use panel::{Language, Report, Round, Speaker, Turn};
use roles::{NewRole, Role, Roles};
use anyhow::Context;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use std::path::{Path as FsPath, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone)]
struct App {
    llm: gemini::Gemini,
    data: PathBuf,
    roles: Arc<Roles>,
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
    /// The report couldn't be written. It can be retried.
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
    /// The candidate stopped before the panel was done, so there is less evidence.
    #[serde(default)]
    ended_by_candidate: bool,
}

fn env(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{name} is not set (run.py sets it)"))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let data = PathBuf::from(std::env::var("DATA_DIR").unwrap_or_else(|_| "data".into()));
    std::fs::create_dir_all(&data)?;
    let app = App {
        llm: gemini::Gemini::new(env("GEMINI_API_KEY")),
        roles: Arc::new(Roles::load(&data).context("could not load roles")?),
        data,
        busy: Arc::default(),
    };
    // Reports that were being written when the server stopped.
    for i in all(&app).into_iter().filter(|i| i.status == Status::Reporting) {
        tokio::spawn(write_report(app.clone(), i.id));
    }

    // A demo: everything is open, including the panel's notes.
    let api = Router::new()
        .route("/health", get(|| async { Json(json!({ "ok": true })) }))
        .route("/roles", get(list_roles).post(add_role))
        .route("/interviews", post(start))
        .route("/interviews/{id}", get(candidate_view))
        .route("/interviews/{id}/messages", post(message))
        .route("/interviews/{id}/finish", post(finish))
        .route("/review", get(review_list))
        .route("/review/{id}", get(review_one))
        .route("/review/{id}/report", post(retry_report))
        .fallback(|| async { fail(StatusCode::NOT_FOUND, "No such API route") });
    let site = ServeDir::new("public").fallback(ServeFile::new("public/index.html"));
    let router = Router::new().nest("/api", api).fallback_service(site).with_state(app);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8020".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}"))
        .await
        .with_context(|| format!("port {port} is taken: is an old server still running?"))?;
    println!("[server] listening on :{port}");
    axum::serve(listener, router).await?;
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

/// Writes through a temp file, so a crash never leaves half a file behind.
fn write_json<T: Serialize + ?Sized>(path: &FsPath, value: &T) -> std::io::Result<()> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, serde_json::to_vec(value)?)?;
    std::fs::rename(&tmp, path)
}

fn save(app: &App, i: &Interview) -> Res<()> {
    let p = path(app, &i.id).ok_or_else(|| fail(StatusCode::BAD_REQUEST, "Bad id"))?;
    write_json(&p, i).map_err(could_not_save)
}

fn all(app: &App) -> Vec<Interview> {
    let mut v: Vec<Interview> = std::fs::read_dir(&app.data)
        .into_iter()
        .flatten()
        .flatten()
        // Only <interview id>.json: skips leftover .tmp files and custom-roles.json.
        .filter_map(|e| load(app, e.file_name().to_str()?.strip_suffix(".json")?).ok())
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

fn could_not_save(e: std::io::Error) -> Fail {
    fail(StatusCode::INTERNAL_SERVER_ERROR, format!("Could not save: {e}"))
}

fn role(app: &App, id: &str) -> Res<Role> {
    app.roles.get(id).ok_or_else(|| fail(StatusCode::NOT_FOUND, "Role not found"))
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

// ── roles ───────────────────────────────────────────────────────────────────

async fn list_roles(State(app): State<App>) -> Json<Vec<Role>> {
    Json(app.roles.all())
}

/// A judge or company describes a role on the spot; it can be interviewed for at once.
async fn add_role(State(app): State<App>, Body(b): Body<NewRole>) -> Res<(StatusCode, Json<Role>)> {
    let role = b.into_role().map_err(|e| fail(StatusCode::BAD_REQUEST, e))?;
    app.roles.add(role.clone()).map_err(could_not_save)?;
    Ok((StatusCode::CREATED, Json(role)))
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

/// What the candidate's screen gets after each turn.
#[derive(Serialize)]
struct Step {
    id: String,
    message: String,
    done: bool,
    /// 0-100: how close the panel is to a result.
    progress: u8,
}

impl Step {
    fn new(id: &str, step: &panel::Step) -> Self {
        Step { id: id.into(), message: step.message.clone(), done: step.round.is_done, progress: step.round.progress() }
    }
}

async fn start(State(app): State<App>, Body(b): Body<StartBody>) -> Res<(StatusCode, Json<Step>)> {
    let role = role(&app, &b.role_id)?;
    let step = panel::next_turn(&app.llm, &role, &[], &[], b.language).await.map_err(panel_failed)?;
    let reply = Step::new(&ulid::Ulid::generate().to_string(), &step);
    let i = Interview {
        id: reply.id.clone(),
        role_id: role.id,
        language: b.language,
        status: Status::Active,
        transcript: vec![Turn::new(Speaker::Interviewer, step.message)],
        rounds: vec![step.round],
        report: None,
        created_at: now(),
        ended_by_candidate: false,
    };
    save(&app, &i)?;
    Ok((StatusCode::CREATED, Json(reply)))
}

async fn message(State(app): State<App>, Path(id): Path<String>, Body(b): Body<MessageBody>) -> Res<Json<Step>> {
    let text = b.text.trim().to_string();
    if text.is_empty() || text.chars().count() > 8000 {
        return Err(fail(StatusCode::BAD_REQUEST, "The message must be 1-8000 characters"));
    }
    let _busy = Busy::take(&app, &id)?;
    let mut i = load_active(&app, &id)?;
    let role = role(&app, &i.role_id)?;

    // Stored only once the panel has answered, so a 503 leaves nothing behind.
    i.transcript.push(Turn::new(Speaker::Candidate, text));
    let step = panel::next_turn(&app.llm, &role, &i.transcript, &i.rounds, i.language).await.map_err(panel_failed)?;

    let reply = Step::new(&id, &step);
    i.transcript.last_mut().unwrap().kind = step.kind;
    i.transcript.push(Turn::new(Speaker::Interviewer, step.message));
    i.rounds.push(step.round);
    if reply.done { begin_report(&app, i)? } else { save(&app, &i)? }
    Ok(Json(reply))
}

/// The candidate stops early. The panel assesses what was said so far.
async fn finish(State(app): State<App>, Path(id): Path<String>) -> Res<StatusCode> {
    let _busy = Busy::take(&app, &id)?;
    let mut i = load_active(&app, &id)?;
    if !i.transcript.iter().any(|t| t.speaker == Speaker::Candidate) {
        return Err(fail(StatusCode::CONFLICT, "Answer at least one question first"));
    }
    i.ended_by_candidate = true;
    begin_report(&app, i)?;
    Ok(StatusCode::ACCEPTED)
}

fn load_active(app: &App, id: &str) -> Res<Interview> {
    let i = load(app, id)?;
    if i.status != Status::Active {
        return Err(fail(StatusCode::CONFLICT, "This interview is finished"));
    }
    Ok(i)
}

/// Marks the interview `reporting` and writes the report in the background.
fn begin_report(app: &App, mut i: Interview) -> Res<()> {
    i.status = Status::Reporting;
    save(app, &i)?;
    tokio::spawn(write_report(app.clone(), i.id));
    Ok(())
}

/// The verdicts and report take a minute or two, so they run after the
/// candidate's last message has been answered.
async fn write_report(app: App, id: String) {
    let Ok(mut i) = load(&app, &id) else { return };
    let result = match app.roles.get(&i.role_id) {
        Some(role) => panel::report(&app.llm, &role, &i.transcript, i.language).await,
        None => Err(anyhow::anyhow!("role {} no longer exists", i.role_id)),
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
        "role": app.roles.get(&i.role_id),
        "status": i.status,
        "progress": i.rounds.last().map_or(0, |r| r.progress()),
        "transcript": transcript,
        "feedback": i.report.map(|r| r.candidate_feedback),
    })))
}

// ── review routes ────────────────────────────────────────────────────────────

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
                    "ended_by_candidate": i.ended_by_candidate,
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
    let i = load(&app, &id)?;
    if i.status != Status::Failed {
        return Err(fail(StatusCode::CONFLICT, "Only a failed report can be retried"));
    }
    begin_report(&app, i)?;
    Ok(StatusCode::ACCEPTED)
}
