# SkillCheck: checklist

Deadline: **Sun 15 Nov, 10:00** (submission). Plan: build until ~22:00–24:00 Saturday, then video + presentation (Eduard). Teammate continues building in the night/morning.

## ✅ Done
- Server in Finland (Verda A100): Gemma 4 26B (privacy guard + 3 agents), Whisper, app, HTTPS
- Database in Finland (Aiven Postgres), 26 tables, demo data generator (`npm run db:demo`)
- Login with 3 roles, JWT/bearer, platform API `/api/v1`
- Testing rooms (EXAM model): venues, rooms, workstations, 30-min slots, booking up to 3 needs, reschedule ≥ 2 h (max 2), cancel
- Kiosk: City enrolls a computer, only the booked person can log in, check only runs there, auto logout
- Adaptive interview (difficulty, company question bank, easy filter mode, covers every skill)
- BARS scoring: anchors, verified quotes, two runs, computed match/level/confidence. Fairness: fluent vs non-native 7.0 vs 6.7
- Privacy guard follows the Non-Discrimination Act (age, origin, religion, family… and revealing dates removed, durations kept)
- Optional language requirement per need (CEFR), one question in that language, own score, never mixed into the match
- Privacy: pseudonymised answers, companies see alias only, contact sharing by consent, City reveals identity only with a reason
- Decisions: City and company can both accept, company "no" only for itself. Stamps on the lanyard card (consent)
- Events: companies apply → City approves → confirm ≥ 1 week before; required/optional/not needed per company; City can make an event open
- GDPR: append-only audit (UPDATE/DELETE/TRUNCATE blocked), export, erasure, "who used my data"
- ESCO skills, robust JSON retry, docs (handover, repository, database, architecture, decisions, research, Espoo questions)

## 🔴 Must (before the video)
| # | Item | Who |
|---|---|---|
| 1 | Tour stop 5: click through every screen together, list what to remove or simplify | Eduard + Claude |
| 2 | UI clean-up from that list (one clear action per screen, no filler) | Claude |
| 3 | Finnish and Swedish texts in the portals (landing already done) | Claude / teammate |
| 4 | 15-minute meetings (match TalentMatch) | Claude |
| 5 | Security before going public: reset Aiven password, IP allowlist, different demo password on the live site | **Eduard (Aiven)** + Claude |
| 6 | Rate limits on login and AI endpoints (cost and abuse) | Claude / teammate |
| 7 | README for the repo | Claude |
| 7b | **Typography and logo refresh**: choose better fonts for the site and the wordmark (Eduard dislikes the current ones) | Eduard + Claude |

## 🟠 Should (prizes and polish)
| # | Item | Who |
|---|---|---|
| 8 | **Gemini**: second judge (jury) + interviewer option, then re-run demo data. Needs the key | Claude / teammate |
| 9 | **Fairness test bench** with more answers in fi/sv/en → numbers for a slide (could run on **Modal** for that prize) | Teammate |
| 10 | Online and hybrid events: video meetings, digital badge instead of lanyard | Teammate |
| 11 | Company screens: review/edit anchors and question bank, accept similar needs (backend exists, no UI yet) | Teammate |
| 12 | **Automated tests**: unit tests (score computation, accept rule, kiosk rules, JSON fallback, pseudonymisation patterns) + API end-to-end tests (turn Claude's test scripts into a repo test suite, e.g. Vitest), run on every push | Teammate |
| 12b | **CRACI**: run those tests + lint/typecheck/build in GitHub Actions on CRACI runners (easy tech-challenge entry) | Teammate |
| 13 | Context.dev: draft a need from the company website (needs key) | Teammate |
| 14 | Mobile layout check, accessibility (keyboard, screen reader, contrast) | Teammate |

## 🟢 Could (roadmap slide if no time)
- Modal sandbox code task for tech roles
- Finnish-tuned Whisper, GLiNER2-PII extra privacy layer
- Safe Exam Browser header check on kiosks
- Restricted DB user (no ALTER/TRUNCATE), scheduled deletion after 12 months
- Video-of-work path for hands-on roles
- Stamps as European Digital Credentials

## 🎬 Submission (Sunday morning, Eduard)
- [ ] Fresh demo data: `npm run db:fresh` (about 15 min)
- [ ] Pitch video, max 2:00 (record a backup screen recording of the demo too)
- [ ] Pitch deck PDF (Prezi export tool)
- [ ] Verda process summary posted in their Discord (required for the Verda prize)
- [ ] Repo public (check no secrets: `.env.local` is git-ignored)
- [ ] Submission form: Espoo + tech challenges (Verda, Gemma, Gemini, Modal, Context.dev, Aiven, CRACI), set to **FINAL** before 10:00
- [ ] All team members at peer review 10:30–14:00
- [ ] After the final ceremony: delete the Verda instance and the Aiven service
