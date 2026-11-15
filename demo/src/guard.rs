//! Privacy guard: every candidate answer is pseudonymised BEFORE any Gemini model reads it.
//! Same two layers as the SkillCheck platform (dev branch, src/lib/ai/guard.ts):
//! 1. fixed patterns for emails, phone numbers and web addresses,
//! 2. Gemma 4 26B on our own GPU server in Finland (Verda) for names, employers, schools, places,
//!    and everything the Finnish Non-Discrimination Act protects (age, origin, gender, health, family...).
//! The panel then cannot be swayed by a name, an employer or an accent, and no identity leaves Finland.
//!
//! Settings: GUARD_BASE_URL (OpenAI-compatible vLLM, e.g. http://127.0.0.1:8001/v1), GUARD_MODEL (default "gemma"),
//! VLLM_API_KEY. Without GUARD_BASE_URL only the patterns run (local development without the GPU).
//! If Gemma is set up but does not answer, the answer is refused: nothing goes to Gemini unredacted.

use regex::Regex;
use reqwest::Client;
use serde_json::{Value, json};
use std::sync::LazyLock;
use std::time::Duration;

const SYSTEM: &str = "You are a privacy filter for a public-sector recruitment skill check in Finland. Rewrite the user's text so that it contains no identifying details and nothing about the grounds protected by the Finnish Non-Discrimination Act. Change NOTHING else (same language, same wording, same technical content, same reasoning).

Replace with tags:
- person names -> [NAME]
- employers, companies, clients, brands of former workplaces -> [EMPLOYER]
- schools, universities, courses with an institution name -> [SCHOOL]
- cities, countries, regions, addresses, places -> [PLACE]
- nationality, ethnic origin, mother tongue, where someone learned a language -> [ORIGIN]
- emails, phone numbers, URLs, social handles -> [CONTACT]
- calendar years or dates that reveal age, studies or life events (\"born 1985\", \"graduated in 1998\", \"moved here in 2022\") -> [YEAR]
- age, gender, religion, belief, political views, union membership, family situation, health, disability, sexual orientation -> [PERSONAL]

KEEP unchanged:
- durations and amounts (\"3 years of SQL\", \"a 6-month project\", \"30%\", \"200 parcels\")
- technologies, tools, versions, methods (Python 3.12, Kubernetes, Excel)
- statements about language SKILLS that are about the job (\"I handle customers in Swedish\")

Output only the rewritten text.";

static PATTERNS: LazyLock<Vec<Regex>> = LazyLock::new(|| {
    [
        r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+",          // emails
        r"(?:https?://|www\.)[^\s]+[^\s.,;:!?)]", // web addresses
        r"\+?\d[\d\s-]{6,}\d",                    // phone numbers
    ]
    .iter()
    .map(|p| Regex::new(p).expect("valid pattern"))
    .collect()
});

/// Layer 1: deterministic, never fails.
pub fn pattern_pass(text: &str) -> String {
    PATTERNS.iter().fold(text.to_string(), |t, re| re.replace_all(&t, "[CONTACT]").into_owned())
}

#[derive(Clone)]
pub struct Guard {
    client: Client,
    base: Option<String>,
    key: String,
    model: String,
}

impl Guard {
    pub fn from_env() -> Self {
        let base = std::env::var("GUARD_BASE_URL").ok().filter(|s| !s.is_empty()).map(|s| s.trim_end_matches('/').to_string());
        match &base {
            Some(b) => eprintln!("[guard] Gemma privacy guard at {b}"),
            None => eprintln!("[guard] GUARD_BASE_URL not set: only the pattern layer runs (development only)"),
        }
        Guard {
            client: Client::builder().timeout(Duration::from_secs(60)).build().expect("http client"),
            base,
            key: std::env::var("VLLM_API_KEY").unwrap_or_default(),
            model: std::env::var("GUARD_MODEL").unwrap_or_else(|_| "gemma".into()),
        }
    }

    /// What the panel may read: the answer with identity and protected grounds replaced by tags.
    pub async fn pseudonymise(&self, text: &str) -> anyhow::Result<String> {
        let pre = pattern_pass(text);
        let Some(base) = &self.base else { return Ok(pre) };
        let body = json!({
            "model": self.model,
            "temperature": 0,
            "max_tokens": 1024,
            "messages": [{ "role": "system", "content": SYSTEM }, { "role": "user", "content": pre }],
        });
        let res: Value = self.client.post(format!("{base}/chat/completions")).bearer_auth(&self.key).json(&body).send().await?.error_for_status()?.json().await?;
        let out = res["choices"][0]["message"]["content"].as_str().unwrap_or("").trim().to_string();
        anyhow::ensure!(!out.is_empty(), "the privacy guard returned nothing");
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::pattern_pass;

    #[test]
    fn contacts_are_removed_and_skills_kept() {
        let t = pattern_pass("Mail me at aino.m@example.fi or call +358 40 123 4567. I used Python 3.12 for 3 years.");
        assert!(!t.contains("example.fi") && !t.contains("123 4567"));
        assert!(t.contains("Python 3.12") && t.contains("3 years"));
    }
}
