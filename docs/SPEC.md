# Skill Check: build spec

**Challenge:** City of Espoo, "Rethinking Recruitment" (+ tech challenges: Verda, Gemma, Gemini API, Modal, Context.dev, Aiven)
**One-liner:** Show what you can do, not what an AI wrote for you. An AI-led skill check in English, Finnish or Swedish gives companies evidence; **people make every decision**.

---

## 1. Demo story (what the judges see, ~2 min)
1. **City admin** creates the event *"Espoo Tech Talent Day"* (rooms, time slots) and invites companies.
2. **Company** (e.g. *Nordic Logistics Oy*) adds a need. It pastes its website → **Context.dev** pulls company data → **Gemini** drafts the need + skill list → the company edits and confirms.
3. **Jobseeker "Aino"** signs up (pseudonymous), picks the company, chooses **Finnish**, and takes the **skill check**: a 6–8 turn conversation with the interviewer (**Gemma on Verda, Helsinki**), plus a small code task run in a **Modal Sandbox**.
4. Gemma anonymises the transcript → **Gemini** scores it: *match 7/10, mid-level, confidence 0.82*, with quotes as evidence → the fairness check passes.
5. **Company** sees anonymous candidates ranked by match, opens Aino's transcript, reads two answers, clicks **Invite to meet** (human decision, logged).
6. Aino gets a **10-min slot, Room B, 13:20** + QR ticket. Her name is revealed to the company only now (mutual opt-in).
7. **City dashboard:** applicants, checks, human decisions, "AI followed vs overridden", fairness flags. Ends on the line: *"AI gathers evidence, humans decide, and all candidate data stays in Finland."*

## 2. Roles & screens
Routes are prefixed with the language: `/en`, `/fi`, `/sv`.

### Public
| Route | Screen |
|---|---|
| `/` | Landing: value prop for each of the 3 roles, "how it works", privacy promise, language switch |
| `/login`, `/signup` | Sign in / sign up, role chosen at signup (city accounts are seeded, not self-signup) |
| `/privacy` | Plain-language privacy + AI Act transparency notice |

### Jobseeker (`/candidate/...`)
| Route | Screen |
|---|---|
| `/candidate` | Dashboard: upcoming event, my checks (status), my bookings |
| `/candidate/profile` | Pseudonymous profile: alias, languages, skills (ESCO chips), consent toggles |
| `/candidate/events/[eventId]` | Event page: participating companies + their needs → "Take skill check" |
| `/candidate/check/[checkId]` | **Skill check chat**: language picker, progress (turn x/8), code task panel when relevant |
| `/candidate/check/[checkId]/result` | Own result: score, level, strengths, "what to improve", how it was decided, retry / video option |
| `/candidate/bookings` | Meeting slots + QR ticket |

### Company (`/company/...`)
| Route | Screen |
|---|---|
| `/company` | Dashboard: my needs, new candidates, meetings |
| `/company/needs/new` | Add need: paste URL (Context.dev) → AI draft → edit → confirm |
| `/company/needs/[needId]` | Candidates for this need: anonymous cards sorted by match, filter by level/confidence |
| `/company/candidates/[checkId]` | **Evidence view**: score + confidence + rubric with quotes, full transcript, code task results → **Invite to meet / Not now / Ask city to review** + note |
| `/company/meetings` | Schedule for the event day |

### City of Espoo (`/city/...`)
| Route | Screen |
|---|---|
| `/city` | Event dashboard: KPIs (registrations, checks done, meetings booked, AI-followed rate, fairness flags) |
| `/city/events` and `/city/events/[eventId]` | Create/edit event, rooms, slots, invite companies |
| `/city/review` | **Human review queue**: low confidence, fairness flags, video submissions → decide + note |
| `/city/audit` | Audit log: who decided what, when, and whether they followed the AI (from system-versioned/history tables) |

## 3. Core flows
**A. Need creation:** URL → Context.dev company data → Gemini drafts `{title, summary, skills[], level, sample tasks}` → company edits → `confirmed_by` + timestamp saved.

**B. Skill check:**
1. Create `skill_check` (candidate, need, language).
2. Gemini generates a question plan + rubric from the need (cached per need, no personal data).
3. Loop (6–8 turns): candidate answer → **Gemma (Verda)** asks the next question, following up on the answer.
4. Optional code task → **Modal Sandbox** runs the code against hidden tests → pass/fail + output stored.
5. End → **Gemma** anonymises the transcript → **Gemini evaluator** → JSON `{match 0–10, level, confidence 0–1, rubric[{criterion, score, evidence_quotes[]}], strengths[], gaps[]}` → **Gemini fairness auditor** → `{flags[], explanation}`.
6. Routing: confidence ≥ 0.6 and no flags → visible to the company. Otherwise → city review queue first.

**C. Decision:** company or city clicks a decision → row in `decisions` (who, role, decision, ai_followed, note). Never automatic.

**D. Booking:** after "Invite to meet", the candidate picks a slot → booking + QR → identity revealed to that company only.

**E. Video path:** hands-on roles → upload video → human-only review (no AI scoring).

## 4. Data model (Postgres on Aiven, Helsinki)
```
users(id, email, role[candidate|company|city], created_at)            -- auth
candidate_profiles(user_id, alias, languages[], skills jsonb, consent jsonb)
companies(id, owner_id, name, website, description, sector, context_data jsonb)
needs(id, company_id, title, summary, skills jsonb, level, source[written|ai_drafted], confirmed_by, confirmed_at, embedding vector)
events(id, title, date, mode[in_person|online|hybrid], location)
event_companies(event_id, company_id)
rooms(id, event_id, name) · slots(id, event_id, room_id, starts_at, ends_at)
skill_checks(id, candidate_id, need_id, language, status, question_plan jsonb, transcript jsonb, anon_transcript jsonb, code_result jsonb, started_at, finished_at)
evaluations(id, check_id, match_score, level, confidence, rubric jsonb, strengths jsonb, gaps jsonb, fairness_flags jsonb, model_versions jsonb, created_at)
decisions(id, check_id, decided_by, role, decision[invite|not_now|needs_review|approve|reject], ai_followed bool, note, created_at)   -- append-only audit log
bookings(id, slot_id, check_id, candidate_id, company_id, status, qr_token)
video_submissions(id, candidate_id, need_id, url, status, reviewed_by, note)
```
Embeddings (pgvector) on needs and candidate skills for "suggested companies for you".

## 5a. Privacy firewall: "Gemini thinks, Gemma guards" (DECIDED)
Every candidate turn, live:
```
Candidate speaks (mic) or types
  → audio/text goes to OUR server in Helsinki (Verda)
  → Gemma 4 12B (Verda, Helsinki): speech → text (fi/sv/en), then pseudonymise
       names, emails, phones, employers, schools, places, nationality → [NAME] [EMPLOYER] [SCHOOL] [PLACE] …
  → candidate sees their own transcript and can correct it before sending (accuracy + transparency)
  → Gemini Pro receives ONLY the pseudonymised text → asks the next question
  → end: Gemini Pro scores + fairness check on the pseudonymised transcript
Raw audio is never stored by default; raw text is kept only in our Helsinki DB (for the candidate + human reviewers).
```
- **Gemma 4 12B** (audio + text, ~24 GB in bf16, fits the A100 80 GB with room for embeddings). Fallback for speech recognition: Whisper large-v3-turbo on the same GPU, if Gemma's Finnish/Swedish transcription is weaker.
- Redaction = deterministic regex first (emails, phones, URLs) + Gemma for names/orgs/places. Belt and braces.
- Bonus fairness: Gemini never sees "Supercell", "Aalto" or "from Ukraine", so it can't be swayed by them.
- Voice is an inclusion feature: people who reason well out loud but write slowly in their 2nd/3rd language aren't penalised.
- Pitch wording: "pseudonymised", not "anonymised".

## 5. AI contracts
| Agent | Model / where | Input | Output |
|---|---|---|---|
| Need drafter | Gemini Pro | company data (public) | need JSON |
| Question planner | Gemini Pro | need | question plan + rubric |
| Listener + guard | Gemma 4 12B on Verda (Helsinki) | candidate audio or text, per turn | transcript + pseudonymised version |
| Interviewer | Gemini Pro | pseudonymised conversation + plan | next question (in the candidate's language) |
| Evaluator | Gemini Pro | anon transcript + rubric + code result | evaluation JSON |
| Fairness auditor | Gemini Pro | anon transcript + evaluation | flags JSON |
Every AI output stores the model name + version for the audit trail.

## 6. Infrastructure
| Piece | Where |
|---|---|
| Next.js app + Gemma (vLLM) + embeddings | Verda GPU instance, Helsinki, Docker Compose + Caddy (HTTPS) |
| Postgres + pgvector | Aiven, UpCloud Helsinki |
| Code sandboxes | Modal |
| Company data | Context.dev |
| Scoring | Gemini API (credits tier, anonymised input only) |

## 7. Build order & owners
| # | Milestone | Owner | Done when |
|---|---|---|---|
| 0 | Accounts, keys, Verda box, Aiven DB | Eduard | keys in `.env`, IP known |
| 1 | Foundation: i18n routes, UI kit, layout, landing, auth + roles, DB schema + seed | Claude + B | can log in as each role |
| 2 | Company: need creation (Context.dev + Gemini) | B | need saved from a URL |
| 3 | **Skill check end-to-end** (Gemma interview → anonymise → Gemini evaluate → fairness) | Claude + B | Aino's check produces an evaluation |
| 4 | Company evidence view + decisions | A | invite logged |
| 5 | City: events/slots, review queue, dashboard, audit | A | KPIs show real data |
| 6 | Booking + QR | A | ticket shown |
| 7 | Modal code task | Claude | sandbox result appears in evidence |
| 8 | Polish, translations, seed story data | A | demo runs start to finish in fi + en |
| 9 | Pitch video, deck PDF, Verda Discord summary, submission | both | submitted before Sun 10:00 |

**Cut line if late:** drop 7 (Modal), then video path, then `/city/audit` (keep the decision log). Never cut 3 or 4.
