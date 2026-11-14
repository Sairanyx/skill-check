# Server API

What the server offers. The frontend asks for new things in `frontend/FRONTEND_API.md`.

Everything is under `/api` on the site's own address. Bodies and responses are JSON, and errors look like `{"error": "…"}`.

## Candidate

**`GET /api/roles`:** the roles that can be interviewed for.
```json
[{ "id": "bricklayer", "company": "…", "title": "Bricklayer", "summary": "…", "skills": ["…"] }]
```

**`POST /api/interviews`:** start an interview. `language` is `fi`, `sv` or `en`.
```json
{ "role_id": "bricklayer", "language": "en" }
```
Returns `{ "id": "01KA…", "message": "<first question>", "done": false }`. The candidate keeps `id`: it's their only identifier.

**`POST /api/interviews/{id}/messages`:** the candidate's message.
```json
{ "text": "…" }
```
Returns `{ "id": "…", "message": "<what the interviewer says next>", "done": false }`.
- A turn takes about 10–20 s. Show that it's thinking, and don't send twice.
- When `done` is `true`, `message` is the thank-you, and the report is written in the next 1–2 minutes.

**`GET /api/interviews/{id}`:** the candidate's own view.
```json
{ "id": "…", "role": { … }, "done": true,
  "transcript": [{ "speaker": "interviewer|candidate", "text": "…" }],
  "feedback": "for the candidate, or null until the report is ready" }
```

Candidate responses never include anything about the models: no scores, no classifications.

## Staff

Staff routes need the header `Authorization: Bearer <STAFF_KEY>`.

**`GET /api/review`:** every interview, newest first.
```json
[{ "id": "…", "role_id": "…", "status": "active|reporting|done|failed",
   "score": 7.3, "is_person_good": true, "disagreement": 1.0, "created_at": 1763130000.0 }]
```

**`GET /api/review/{id}`:** everything about one interview:
- `transcript`: each candidate turn has a `kind`, which is `answer`, `clarifying` or `off_track`.
- `rounds`: each round has the three panel memos, the chair's reasoning and the open question.
- `report`:
  - `is_person_good`, `how_good_or_bad` (0–10)
  - `summary`
  - `skills`: score, reason and the candidate's exact quotes for each skill
  - `strengths`, `gaps`
  - `panel`: the three verdicts, plus `disagreement`
  - `inquiry`, `suggested_conversation`, `candidate_feedback`

## Errors

| Code | Meaning |
|---|---|
| 400 | Bad input |
| 401 | Staff key missing or wrong |
| 404 | Not found |
| 409 | The interview is finished, or the previous message is still being handled |
| 503 | The panel couldn't finish thinking. Nothing was saved: send the same message again |
