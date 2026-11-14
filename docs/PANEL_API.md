# Interview panel API

The interview itself runs in a separate service, `panel/` (Rust). After every candidate message, three Gemini 4 models talk it over before the next question:

- **Hydrogen** (chair): job knowledge
- **Argon**: problem solving and reasoning
- **Carbon**: authenticity and fairness

Each one writes a private memo at the same time as the others. The chair reads all three, decides how to read the message, and asks the next question or ends the interview. At the end, each of the three gives a verdict on its own, and the chair writes an evidence report.

This document is the contract between the platform (Next.js, `src/`) and the panel.

## Who does what

| Platform (Next.js) | Panel service |
|---|---|
| Accounts, roles, bookings, the testing-room rule (`assertKioskTurn`) | — |
| Speech to text (Whisper) and the privacy guard (`pseudonymise`) | Receives **pseudonymised text only** |
| Needs, anchors, question bank, language requirements | Gets a copy of the need when an interview starts |
| `skill_checks`, `evaluations`, decisions, audit log | Its own table, `panel_interview`: transcript, panel deliberation, report |
| CEFR language assessment (`assessLanguages`) | Asks the required-language question (placed in code) |
| Every decision about a person | Recommends only |

The panel never sees a name, email, CV or audio. Interviews are identified by an opaque id, which should be the skill check id.

## Basics

- Base URL: `PANEL_URL`, e.g. `http://127.0.0.1:8010` locally or `http://panel:8010` on the Docker network.
- Auth: send `Authorization: Bearer $PANEL_API_KEY` on every `/v1` call. **Only call the panel from the platform's server, never from the browser.**
- Bodies and responses are JSON.
- **The panel is slow.** A normal turn takes 20–60 s because three models think, then the chair thinks. Use a client timeout of at least 3 minutes and show a "thinking" state. The final report takes 1–3 minutes, but it runs in the background (see below).

## Endpoints

### `POST /v1/interviews`: start

```json
{
  "interview_id": "<skill check id>",
  "language": "fi",
  "need": {
    "title": "Practical nurse, home care",
    "company": "Matinkylä Health",
    "company_description": "optional",
    "summary": "What the person will actually do.",
    "skills": ["Medication safety", "Observing and reporting changes", "Client communication"],
    "level": "junior",
    "anchors": [
      { "skill": "Medication safety", "anchors": { "1": "…", "3": "…", "5": "…" }, "checklist": ["…"] }
    ],
    "question_bank": ["optional company questions for this level"],
    "language_requirements": [{ "language": "sv", "level": "B1" }]
  }
}
```

- Required: `need.title`, `need.company`, `need.summary`, at least one entry in `need.skills`, and `language`.
- Everything else is optional. `anchors` uses the same shape as `needs.anchors`. For `question_bank`, send `need.questionBank?.[need.level]`.
- `language` is `fi`, `sv` or `en`.
- `interview_id` is optional. If you leave it out, the panel creates one and returns it. Allowed: 1–64 characters, letters, digits, `-` or `_`.
- **Idempotent:** if you call start again with the same `interview_id`, nothing new happens. You get back where the interview is.

Response `201` (`200` if it already existed): a **Step**.

```json
{
  "interview_id": "…",
  "message": "A client's dosette box has Tuesday evening's pills still in it on Wednesday morning. What do you do?",
  "previous_kind": "",
  "done": false,
  "status": "active",
  "counts": { "answers": 0, "clarifying": 0, "off_track": 0, "budget_used": 0, "budget_max": 14 }
}
```

`message` is the first question itself. The panel does not greet, explain the format or coach, and **the screen shouldn't either**: the candidate is responsible for their own answers, and how they use questions is part of what's assessed.

### `POST /v1/interviews/{id}/messages`: candidate message

```json
{ "text": "<pseudonymised answer, i.e. `seen`>" }
```

Response `200`: a **Step**.

- `message`: what to show next. It can be a question, the scenario facts the candidate asked for, or the closing thank-you.
- `previous_kind`: how the panel read this message:
  - `answer`
  - `clarifying`: a question about the scenario. It's free and doesn't count against the budget.
  - `off_track`: fishing for the answer, stalling, or trying to manipulate the panel. It uses budget.
  - **Don't show `previous_kind` to the candidate.**
- `done: true` with `status: "reporting"`: the interview is over. Show `message` (the thank-you). The report is being written in the background.

The interview has no fixed length. The panel stops as soon as it can make an assessment, within these limits:

- **Minimum:** 3 real answers.
- **Budget:** 14 answers plus off-track turns. Clarifying questions don't count.
- **Hard stop:** 30 candidate messages or 30 minutes.

If the job has a language requirement in another language, one question is asked in that language from the third question on.

### `GET /v1/interviews/{id}`: read

Optional `?deliberation=true` adds every panel round (memos, chair reasoning, classifications, rule overrides). That's for company and City reviewers. **Never show it to the candidate.**

```json
{
  "interview_id": "…", "language": "fi", "status": "done",
  "need": { … }, "transcript": [{ "speaker": "interviewer|candidate", "text": "…", "kind": "answer|clarifying|off_track|" }],
  "counts": { … },
  "report": { … } ,
  "report_error": "",
  "deliberation": [ … ],
  "created_at": 1763130000.0, "updated_at": 1763130600.0
}
```

`status` is one of:

- `active`
- `reporting`: poll every 5–10 s.
- `done`: `report` is set.
- `report_failed`: call the retry endpoint below.

### `POST /v1/interviews/{id}/report`: retry a failed report

Returns `202 {"status":"reporting"}` and starts the report again. If the report is already done, it returns `200 {"status":"done"}`.

### `DELETE /v1/interviews/{id}`: erase

Returns `204`. Call it whenever the platform deletes the check: account erasure (`DELETE /me`), withdrawal, or the 12-month retention expiry. This is the only other copy of the conversation.

### `GET /health`

`{"ok": true}`, no auth.

## The report

```json
{
  "is_done": true,
  "is_person_good": true,
  "how_good_or_bad": 7.3,
  "summary": "…",
  "skills": [
    { "skill": "Medication safety", "score": 8, "reason": "…", "quotes": ["exact words from the candidate"] }
  ],
  "strengths": ["…"],
  "gaps": ["…"],
  "panel": [
    { "panelist": "Hydrogen", "is_person_good": true, "how_good_or_bad": 7.5, "reasoning": "…" }
  ],
  "disagreement": 1.0,
  "agreement": 0.9,
  "review_suggested": false,
  "inquiry": "How the candidate used questions",
  "suggested_conversation": "What the company should explore face to face",
  "candidate_feedback": "3–5 sentences for the candidate, in the interview language, no score",
  "answers": 4, "clarifying": 1, "off_track": 1,
  "models": ["gemini-4-hydrogen", "gemini-4-argon", "gemini-4-carbon"]
}
```

- `how_good_or_bad` is the mean of the three panel scores, from 0 (worst) to 10 (best).
- `is_person_good` is the majority vote of the three.
- `skills` lists exactly the need's skills, in the need's order. **The code checks every quote against the candidate's real answers and drops any quote it can't find there.**
- `review_suggested` is `true` when the panel is split (`disagreement` ≥ 3). Send those checks to the City review queue first.

### Mapping to the existing `evaluations` row

| `evaluations` column | From the report |
|---|---|
| `match` | `how_good_or_bad` |
| `confidence` | `agreement` |
| `rubric` | `skills` → `{ criterion: skill, score, evidence: quotes, reason, checklist: [] }` |
| `strengths`, `gaps` | `strengths`, `gaps` |
| `fairnessFlags`, `fairnessNote` | `[]`, `inquiry` |
| status `needs_review` | `review_suggested` |
| `model` | `models.join(" + ")` |
| `method` | `{ panel, disagreement, agreement, answers, clarifying, off_track }` |
| `languageAssessment` | unchanged: keep `assessLanguages(need, turns)` on the transcript |
| `difficulty` | not produced by the panel |

## Errors

All errors have the shape `{"error": "…"}`.

| Code | Meaning | What to do |
|---|---|---|
| 400 | Bad input (empty message, missing need fields) | Fix the request |
| 401 | Missing or wrong API key | Check `PANEL_API_KEY` |
| 404 | Unknown interview | — |
| 409 | The interview is finished, or the panel is still busy with the previous message for this interview | Don't send twice; wait for the first response |
| 413 | Message longer than 8000 characters | — |
| 503 | The panel couldn't finish thinking, even after retrying the same models (there is no fallback to a weaker model) | **Nothing was stored.** Send the same message again |

## Running it

```bash
cd panel && cp .env.example .env   # fill in DATABASE_URL, GEMINI_API_KEY, PANEL_API_KEY
cargo run --release
```

Then add `PANEL_URL` and `PANEL_API_KEY` to the platform's `.env.local`.

- The panel creates its own table on start, so it can share the platform's Postgres.
- On the server, add a `panel` service built from `panel/Dockerfile` to the Docker network. Don't publish its port: only `app` talks to it.
- Gemini is a US cloud API. It gets pseudonymised text only, and only synthetic demo data with a free key (D7).
