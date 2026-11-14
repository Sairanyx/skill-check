//! One table. The platform's own database stays the source of truth for
//! people, needs and decisions; this table only holds the panel's working state
//! (pseudonymised transcript, deliberation, report) keyed by an opaque id.

use crate::types::*;
use sqlx::{PgPool, types::Json};

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS panel_interview (
    interview_id  TEXT PRIMARY KEY,
    need          JSONB NOT NULL,
    language      TEXT NOT NULL,
    transcript    JSONB NOT NULL DEFAULT '[]',
    deliberation  JSONB NOT NULL DEFAULT '[]',
    status        TEXT NOT NULL,
    report        JSONB,
    report_error  TEXT NOT NULL DEFAULT '',
    created_at    DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
    updated_at    DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
)";

pub async fn migrate(db: &PgPool) -> sqlx::Result<()> {
    sqlx::query(SCHEMA).execute(db).await?;
    Ok(())
}

pub const ACTIVE: &str = "active";
pub const REPORTING: &str = "reporting";
pub const DONE: &str = "done";
pub const REPORT_FAILED: &str = "report_failed";

#[derive(sqlx::FromRow)]
pub struct Row {
    pub interview_id: String,
    pub need: Json<Need>,
    pub language: String,
    pub transcript: Json<Vec<Turn>>,
    pub deliberation: Json<Vec<PanelRound>>,
    pub status: String,
    pub report: Option<Json<Report>>,
    pub report_error: String,
    pub created_at: f64,
    pub updated_at: f64,
}

pub async fn get(db: &PgPool, id: &str) -> sqlx::Result<Option<Row>> {
    sqlx::query_as("SELECT * FROM panel_interview WHERE interview_id = $1").bind(id).fetch_optional(db).await
}

pub async fn insert(db: &PgPool, id: &str, need: &Need, language: &str, transcript: &[Turn], rounds: &[PanelRound]) -> sqlx::Result<()> {
    sqlx::query("INSERT INTO panel_interview (interview_id, need, language, transcript, deliberation, status) VALUES ($1, $2, $3, $4, $5, $6)")
        .bind(id)
        .bind(Json(need))
        .bind(language)
        .bind(Json(transcript))
        .bind(Json(rounds))
        .bind(ACTIVE)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn save_turn(db: &PgPool, id: &str, transcript: &[Turn], rounds: &[PanelRound], status: &str) -> sqlx::Result<()> {
    sqlx::query(
        "UPDATE panel_interview SET transcript = $2, deliberation = $3, status = $4, updated_at = EXTRACT(EPOCH FROM NOW()) WHERE interview_id = $1",
    )
    .bind(id)
    .bind(Json(transcript))
    .bind(Json(rounds))
    .bind(status)
    .execute(db)
    .await?;
    Ok(())
}

pub async fn save_report(db: &PgPool, id: &str, report: Option<&Report>, error: &str) -> sqlx::Result<()> {
    sqlx::query(
        "UPDATE panel_interview SET report = $2, report_error = $3, status = $4, updated_at = EXTRACT(EPOCH FROM NOW()) WHERE interview_id = $1",
    )
    .bind(id)
    .bind(report.map(Json))
    .bind(error)
    .bind(if report.is_some() { DONE } else { REPORT_FAILED })
    .execute(db)
    .await?;
    Ok(())
}

pub async fn set_status(db: &PgPool, id: &str, status: &str) -> sqlx::Result<()> {
    sqlx::query("UPDATE panel_interview SET status = $2, updated_at = EXTRACT(EPOCH FROM NOW()) WHERE interview_id = $1")
        .bind(id)
        .bind(status)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn delete(db: &PgPool, id: &str) -> sqlx::Result<bool> {
    Ok(sqlx::query("DELETE FROM panel_interview WHERE interview_id = $1").bind(id).execute(db).await?.rows_affected() > 0)
}

pub async fn ids_with_status(db: &PgPool, status: &str) -> sqlx::Result<Vec<String>> {
    sqlx::query_scalar("SELECT interview_id FROM panel_interview WHERE status = $1").bind(status).fetch_all(db).await
}
