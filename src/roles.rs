//! Roles that can be interviewed for: the built-in ones in roles.json, plus
//! any added through the API, kept in DATA_DIR/custom-roles.json.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::RwLock;

#[derive(Serialize, Deserialize, Clone)]
pub struct Role {
    pub id: String,
    pub company: String,
    pub title: String,
    /// What the person will actually do.
    pub summary: String,
    pub skills: Vec<String>,
}

/// A role as someone describes it. The server gives it its id.
#[derive(Deserialize)]
pub struct NewRole {
    company: String,
    title: String,
    summary: String,
    skills: Vec<String>,
}

const MAX_SKILLS: usize = 8;

impl NewRole {
    /// Trims and checks every field. The error is a message for whoever sent it.
    pub fn into_role(self) -> Result<Role, String> {
        let company = checked("company", self.company, 120)?;
        let title = checked("title", self.title, 80)?;
        let summary = checked("summary", self.summary, 600)?;
        let skills: Vec<String> = self
            .skills
            .into_iter()
            .filter(|s| !s.trim().is_empty())
            .map(|s| checked("each skill", s, 80))
            .collect::<Result<_, _>>()?;
        if skills.is_empty() || skills.len() > MAX_SKILLS {
            return Err(format!("skills: give 1-{MAX_SKILLS}"));
        }
        // A readable slug, plus random ULID characters so ids never collide.
        let words: Vec<&str> = title.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).collect();
        let slug: String = words.join("-").to_lowercase().chars().take(40).collect();
        let random = ulid::Ulid::generate().to_string()[18..].to_lowercase();
        let id = if slug.is_empty() { format!("role-{random}") } else { format!("{slug}-{random}") };
        Ok(Role { id, company, title, summary, skills })
    }
}

fn checked(field: &str, value: String, max: usize) -> Result<String, String> {
    let v = value.trim();
    match v.chars().count() {
        0 => Err(format!("{field} is empty")),
        n if n > max => Err(format!("{field} is longer than {max} characters")),
        _ => Ok(v.to_string()),
    }
}

pub struct Roles {
    file: PathBuf,
    /// The built-in roles first, then the custom ones.
    list: RwLock<Vec<Role>>,
    builtin: usize,
}

impl Roles {
    pub fn load(data: &Path) -> anyhow::Result<Self> {
        let file = data.join("custom-roles.json");
        let mut list: Vec<Role> = serde_json::from_str(include_str!("roles.json"))?;
        let builtin = list.len();
        if file.exists() {
            list.extend(serde_json::from_slice::<Vec<Role>>(&std::fs::read(&file)?)?);
        }
        Ok(Roles { file, list: RwLock::new(list), builtin })
    }

    pub fn all(&self) -> Vec<Role> {
        self.list.read().unwrap().clone()
    }

    pub fn get(&self, id: &str) -> Option<Role> {
        self.list.read().unwrap().iter().find(|r| r.id == id).cloned()
    }

    pub fn add(&self, role: Role) -> std::io::Result<()> {
        let mut list = self.list.write().unwrap();
        list.push(role);
        crate::write_json(&self.file, &list[self.builtin..]).inspect_err(|_| {
            list.pop(); // not saved, so not added
        })
    }
}
