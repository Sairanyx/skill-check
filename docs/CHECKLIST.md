# SkillCheck: checklist

Deadline: **Sun 15 Nov, 10:00** (submission). Plan: build until ~22:00 to 24:00 Saturday, then video + presentation (Eduard). Teammate continues building in the night/morning.
Status: **Sat 14 Nov, 17:00**. Live: https://skillcheck.fi

## ✅ Done
- Servers in Finland: Verda A100 80GB (Gemma 4 26B-A4B for the privacy guard + agents, Whisper large-v3-turbo, app, HTTPS) and a Verda A100 40GB Spot for the Mistral judge (being set up)
- Database in Finland (Aiven Postgres), 27 tables, demo data generator (`npm run db:demo`)
- Domain **https://skillcheck.fi** with HTTPS (www and the old verda.run address redirect)
- Login with 3 roles, JWT/bearer, platform API `/api/v1`
- Testing rooms (EXAM model): venues, rooms, workstations, 30-min slots, booking up to 3 needs, reschedule ≥ 2 h (max 2), cancel
- Kiosk: City enrolls a computer, only the booked person can log in, check only runs there, auto logout
- Adaptive interview (difficulty, company question bank, easy filter mode, covers every skill)
- BARS scoring: anchors, verified quotes, computed match/level/confidence. Fairness: fluent vs non-native 7.0 vs 6.7
- **Panel of judges** from different companies, median per skill, disagreement lowers confidence. Code done, live uses Gemma only until switched on. Benchmark script `npm run bench:panel` (not run yet)
- Privacy guard follows the Non-Discrimination Act (age, origin, religion, family… and revealing dates removed, durations kept)
- **Optional language requirement** per need (CEFR): one question in that language, own score, never mixed into the match
- **Official proofs instead of a CV**: jobseeker adds them, City desk verifies in person, companies see "Verified by the City" only
- Privacy: pseudonymised answers, companies see alias only, contact sharing by consent, City reveals identity only with a reason
- Decisions: City and company can both accept, company "no" only for itself. Stamps on the lanyard card (consent)
- Events: companies apply → City approves → confirm ≥ 1 week before. Required/optional/not needed per company. City can make an event open
- GDPR: append-only audit (UPDATE/DELETE/TRUNCATE blocked), export, erasure, "who used my data"
- ESCO skills, robust JSON retry, retries on rate limits
- Docs: handover (for the teammate), repository, database, architecture + capacity estimate, decisions D1 to D18, research, Espoo questions

## ⏳ In progress
| Item | State | Who |
|---|---|---|
| **Mistral judge** on the Spot server (135.181.63.165) | Verda Spot has no internet, so the model is downloaded through the main server. Then: start, connect, `JUDGES=gemma,mistral` | Claude |

## 🔴 Must (before the video)
| # | Item | Who |
|---|---|---|
| 1 | Tour of the live site: click through every screen together, list what to remove or simplify | Eduard + Claude |
| 2 | UI clean-up from that list (one clear action per screen, no filler) | Claude |
| 3 | Finnish and Swedish texts in the portals (landing already done), after the UI is final | Claude / teammate |
| 4 | 15-minute meetings (match TalentMatch) | Claude |
| 5 | Security before going public: **reset Aiven password** + IP allowlist, different demo password on the live site | **Eduard (Aiven)** + Claude |
| 6 | Rate limits on login and AI endpoints (cost and abuse) | Claude / teammate |
| 7 | README for the repo (exact model names, how to run, screenshots) | Claude |
| 7b | Typography and logo refresh (Eduard dislikes the current fonts) | Eduard + Claude |
| 7c | **Judges switched on + one benchmark run** (Gemma + Mistral + Gemini): agreement and native vs non-native gap → slide. Uses Gemini credits, Eduard says go | Claude, Eduard approves |
| 7d | Fresh demo data (`npm run db:fresh`, ~5 min) so proofs, language and the panel show on the live site. Wipes the shared DB | Claude, Eduard approves |

## 🟠 Should (prizes and polish)
| # | Item | Who |
|---|---|---|
| 8 | Gemini as interviewer option (judge part is done) | Claude / teammate |
| 9 | Fairness test bench with more answers in fi/sv/en (could run on **Modal** for that prize) | Teammate |
| 10 | Online and hybrid events: video meetings, digital badge instead of lanyard | Teammate |
| 11 | Company screens: language/proof requirements on existing needs, edit anchors and question bank, accept similar needs (backend exists) | Teammate |
| 12 | **Automated tests**: unit tests (score computation, median panel, accept rule, kiosk rules, proofs, pseudonymisation patterns) + API tests (Claude's scripts → Vitest), run on every push | Teammate |
| 12b | **CRACI**: tests + lint/typecheck/build in GitHub Actions on CRACI runners | Teammate |
| 13 | Context.dev: draft a need from the company website (needs key) | Teammate |
| 14 | Mobile layout check, accessibility (keyboard, screen reader, contrast) | Teammate |
| 14b | Handover for Espoo IT: "try without a GPU" mode and a short operations guide | Claude / teammate |

## 🟢 Could (roadmap slide if no time)
- Modal sandbox code task for tech roles
- Finnish-tuned Whisper, GLiNER2-PII extra privacy layer
- Safe Exam Browser header check on kiosks
- Restricted DB user (no ALTER/TRUNCATE), scheduled deletion after 12 months
- Video-of-work path for hands-on roles
- Stamps and proofs as European Digital Credentials
- Calibrate against real human decisions after a pilot (no fine-tuning, D18)

## 🎬 Submission (Sunday morning, Eduard)
- [ ] Fresh demo data: `npm run db:fresh` (~5 min)
- [ ] Pitch video, max 2:00, **name the exact models** (record a backup screen recording of the demo too)
- [ ] Pitch deck PDF (Prezi export tool)
- [ ] Verda process summary posted in their Discord (required for the Verda prize. Mention the Spot + no-internet workaround)
- [ ] Repo public (check no secrets: `.env.local` is git-ignored)
- [ ] Submission form: Espoo + tech challenges (Verda, Gemma, Gemini, Modal, Context.dev, Aiven, CRACI), set to **FINAL** before 10:00
- [ ] All team members at peer review 10:30 to 14:00
- [ ] After the final ceremony: delete **both** Verda instances, the Aiven service. Gemini account is deleted by Google
