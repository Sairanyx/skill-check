//! SkillCheck interview panel.
//!
//! A small HTTP service that runs the interview: three Gemini 4 models
//! (Hydrogen, Argon, Carbon) each write a private memo after every candidate
//! message, the chair (Hydrogen) answers them and decides the next question or
//! that the panel has enough to assess. At the end the three give independent
//! verdicts and the chair writes an evidence report.
//!
//! The platform (Next.js app) owns people, bookings, the testing-room rules,
//! speech-to-text, the privacy guard and every decision. It calls this service
//! from its server with pseudonymised text only. See docs/PANEL_API.md.

mod db;
mod gemini;
mod panel;
mod prompt;
mod routes;
mod types;

use std::collections::HashSet;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub llm: gemini::Gemini,
    pub api_key: Arc<String>,
    /// Interviews with a request in flight.
    pub busy: Arc<Mutex<HashSet<String>>>,
}

fn env(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{name} is not set (see panel/.env.example)"))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();
    let api_key = env("PANEL_API_KEY");
    anyhow::ensure!(api_key.len() >= 16, "PANEL_API_KEY must be at least 16 characters");

    let db = sqlx::postgres::PgPoolOptions::new().max_connections(10).connect(&env("DATABASE_URL")).await?;
    db::migrate(&db).await?;

    let state = AppState {
        db,
        llm: gemini::Gemini::new(env("GEMINI_API_KEY")),
        api_key: Arc::new(api_key),
        busy: Arc::default(),
    };

    // Reports that were being written when the service stopped.
    for id in db::ids_with_status(&state.db, db::REPORTING).await? {
        routes::spawn_report(state.clone(), id);
    }

    let addr = std::env::var("PANEL_ADDR").unwrap_or_else(|_| "127.0.0.1:8010".into());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    println!("[panel] listening on http://{addr}");
    axum::serve(listener, routes::router(state)).await?;
    Ok(())
}
