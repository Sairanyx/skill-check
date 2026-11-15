# Server API

What the server offers. The frontend asks for new things in `frontend/FRONTEND_API.md`.

Everything is under `/api` on the site's own address. Bodies and responses are JSON, and errors look like `{"error": "…"}`.

Nothing needs a key or a login: this is a demo, open to anyone.

## Roles

**`GET /api/roles`:** the roles that can be interviewed for. The built-in ones come first, then the added ones, oldest first.
```json
[{ "id": "bricklayer", "company": "…", "title": "Bricklayer", "summary": "…", "skills": ["…"] }]
```

**`POST /api/roles`:** add a role on the spot (a judge or company describing what the job really is).
```json
{ "company": "Judge Challenge Oy (synthetic)", "title": "Stainless TIG Welder",
  "summary": "Fit up and TIG-weld thin-wall sanitary stainless piping…",
  "skills": ["Fit-up and back-purging", "Weld defects and inspection"] }
```
Returns `201` with the role, whose new `id` is made from the title (e.g. `stainless-tig-welder-ptvffres`). It shows up in `GET /api/roles`, and `POST /api/interviews` takes its id at once. The panel scores each skill separately in the report.
- All fields are required and trimmed. `company` up to 120 characters, `title` up to 80, `summary` up to 600, and 1–8 `skills` of up to 80 each (blank skills are dropped).
- Otherwise `400` with what's wrong, e.g. `{"error": "title is empty"}`.

## Candidate

**`POST /api/interviews`:** start an interview. `language` is `fi`, `sv` or `en`.
```json
{ "role_id": "bricklayer", "language": "en" }
```
Returns `{ "id": "01KA…", "message": "<first question>", "done": false, "progress": 0 }`. The candidate keeps `id`: it's their only identifier.

**`POST /api/interviews/{id}/messages`:** the candidate's message.
```json
{ "text": "…" }
```
Returns `{ "id": "…", "message": "<what the interviewer says next>", "done": false, "progress": 42 }`.
- `progress` (0–100) is how close the panel is to a result: show it as a bar. It's 100 only when `done`, and it can go down if an answer raises new doubts.
- A turn takes about 10–20 s. Show that it's thinking, and don't send twice.
- When `done` is `true`, `message` is the thank-you, and the report is written in the next 1–2 minutes.

**`POST /api/interviews/{id}/finish`:** the candidate stops now. No body. Returns `202`; the interview is `reporting` and the panel assesses what was said so far (review shows `ended_by_candidate: true`). `409` if it's already finished or the candidate hasn't answered anything yet.

**`GET /api/interviews/{id}`:** the candidate's own view.
```json
{ "id": "…", "role": { … }, "status": "active|reporting|done|failed", "progress": 42,
  "transcript": [{ "speaker": "interviewer|candidate", "text": "…" }],
  "feedback": "for the candidate, or null until the report is ready" }
```
Poll this while `status` is `reporting`. `feedback` arrives with `done`; on `failed` stop polling (it can be retried, below).

## Review

This is a demo, so review is open to anyone: no key, no login. A real deployment would put it behind staff sign-in, so a candidate can't watch the panel's notes mid-interview.

**`GET /api/review/{id}`:** everything about one interview:
- `transcript`: each candidate turn has a `kind`, which is `answer`, `clarifying` or `off_track`.
- `rounds`: each round has the three panel `memos` (each with `reads_last_message_as`, `observations`, `proposed_question`, `readiness` 0–100 and `provisional_score`), the chair's reasoning, the open `question`, the panel's weighted `readiness`, `is_done` and `ended_because` (empty until it ends; "panel ready …" or "limit reached …"). Carbon is the chair and counts 1.5×.
- `report`:
  - `is_person_good`, `how_good_or_bad` (0–10)
  - `summary`
  - `skills`: score, reason and the candidate's exact quotes for each skill
  - `strengths`, `gaps`
  - `panel`: the three verdicts, plus `disagreement`
  - `inquiry`, `suggested_conversation`, `candidate_feedback`

**`GET /api/review`:** every interview, newest first.
```json
[{ "id": "…", "role_id": "…", "status": "active|reporting|done|failed",
   "score": 7.3, "is_person_good": true, "disagreement": 1.0,
   "ended_by_candidate": false, "created_at": 1763130000.0 }]
```

**`POST /api/review/{id}/report`:** write a `failed` report again. Returns `202` with no body; the interview is `reporting`, then `done` or `failed`. Any other status gets `409`.

## Errors

| Code | Meaning |
|---|---|
| 400 | Bad input |
| 404 | Not found |
| 409 | The interview is finished, the previous message is still being handled, or the report isn't `failed` (retry) |
| 503 | The panel couldn't finish thinking. Nothing was saved: send the same message again |
