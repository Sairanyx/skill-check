//! Minimal Gemini client: structured JSON output over the streaming endpoint.
//!
//! Streaming is used only to detect stalls. A thinking model sends a thought
//! summary every second or two, so silence for `idle` means the request is
//! stuck, not thinking hard. There is no cap on total duration.

use reqwest::Client;
use serde_json::{Value, json};
use std::time::Duration;

#[derive(Clone)]
pub struct Gemini {
    client: Client,
    api_key: String,
}

#[derive(Debug)]
pub enum StreamError {
    /// No bytes at all for this long.
    Stalled(Duration),
    /// Rate limit, server error, dropped connection, cut-off JSON: retry.
    Transient(String),
    /// Bad request, bad key, unknown model: retrying won't help.
    Fatal(String),
}

impl std::fmt::Display for StreamError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StreamError::Stalled(d) => write!(f, "stalled: no tokens for {}s", d.as_secs()),
            StreamError::Transient(e) => write!(f, "transient: {e}"),
            StreamError::Fatal(e) => write!(f, "fatal: {e}"),
        }
    }
}

impl std::error::Error for StreamError {}

impl Gemini {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::builder().connect_timeout(Duration::from_secs(15)).build().expect("http client"),
            api_key,
        }
    }

    pub async fn json(
        &self,
        model: &str,
        system: &str,
        task: &str,
        schema: &Value,
        thinking_level: &str,
        idle: Duration,
    ) -> Result<Value, StreamError> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse"
        );
        let body = json!({
            "systemInstruction": { "parts": [{ "text": system }] },
            "contents": [{ "role": "user", "parts": [{ "text": task }] }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": schema,
                "thinkingConfig": { "thinkingLevel": thinking_level, "includeThoughts": true },
            },
        });

        let send = self.client.post(&url).header("x-goog-api-key", &self.api_key).json(&body).send();
        let mut res = match tokio::time::timeout(idle, send).await {
            Err(_) => return Err(StreamError::Stalled(idle)),
            Ok(Err(e)) => return Err(StreamError::Transient(e.to_string())),
            Ok(Ok(r)) => r,
        };
        let status = res.status();
        if !status.is_success() {
            let text = res.text().await.unwrap_or_default();
            let msg = format!("Gemini {status}: {}", text.chars().take(400).collect::<String>());
            return Err(if status.as_u16() == 429 || status.is_server_error() {
                StreamError::Transient(msg)
            } else {
                StreamError::Fatal(msg)
            });
        }

        let mut buf = String::new();
        let mut answer = String::new();
        loop {
            let chunk = match tokio::time::timeout(idle, res.chunk()).await {
                Err(_) => return Err(StreamError::Stalled(idle)),
                Ok(Err(e)) => return Err(StreamError::Transient(e.to_string())),
                Ok(Ok(None)) => break,
                Ok(Ok(Some(c))) => c,
            };
            buf.push_str(&String::from_utf8_lossy(&chunk));
            // SSE events are separated by a blank line; keep any partial tail.
            while let Some(end) = buf.find("\n\n").or_else(|| buf.find("\r\n\r\n")) {
                let event: String = buf.drain(..end).collect();
                buf = buf.trim_start_matches(['\r', '\n']).to_string();
                for line in event.lines() {
                    let Some(data) = line.strip_prefix("data:") else { continue };
                    let Ok(v) = serde_json::from_str::<Value>(data.trim()) else { continue };
                    if let Some(ps) = v["candidates"][0]["content"]["parts"].as_array() {
                        for p in ps.iter().filter(|p| !p["thought"].as_bool().unwrap_or(false)) {
                            if let Some(t) = p["text"].as_str() {
                                answer.push_str(t);
                            }
                        }
                    }
                }
            }
        }
        serde_json::from_str(answer.trim()).map_err(|e| {
            // Cut off mid-JSON is a dropped stream, not a model mistake.
            StreamError::Transient(format!("incomplete JSON ({e}), {} chars", answer.len()))
        })
    }
}
