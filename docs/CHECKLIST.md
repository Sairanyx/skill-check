# Skill Check: checklist

Tick items off as we finish and check them together. Deadline: **Sun 15 Nov, 10:00** (submission).

## What we have so far

### ✅ Working and committed
| Area | What works |
|---|---|
| Server (Verda, Finland) | A100 GPU running **Gemma 4 12B** (privacy guard + agents) and **Whisper** (speech to text), app in Docker, automatic HTTPS |
| Database (Aiven, Finland) | Postgres with pgvector, backups in Finland |
| Login | Email + password, roles candidate / company / city set only by the server, JWT + bearer tokens for other systems |
| AI | Speech to text fi/sv/en, privacy guard fi/sv/en (~1 s), 3 agents: interviewer, evaluator (0–10, level, confidence, quotes), fairness auditor |
| GDPR | Access log, audit records the database refuses to change or delete, data export, account erasure, "who used my data" page |
| Open data | Company skills linked to **ESCO** with fi/sv names |
| Company view | Ranked anonymous candidates, evidence page with pseudonymised transcript, human decisions |
| City view | Numbers, human review queue, audit log |

### 🟡 In progress (backend written, not committed, pages not updated yet)
- **Testing rooms (EXAM-room model):** venues → rooms → workstations → 30 min slots, booking up to 3 needs, reschedule ≥ 2 h before (max 2), cancel, no no-show penalty
- **Kiosk:** City staff enroll a computer, only the booked person can log in there during their slot, the check only runs on that computer
- **Adaptive difficulty** (low / medium / high), company **question bank** per level (screened for unfair questions), **easy filter mode** when the company sets nothing up
- **Companies:** confirm attendance (≥ 1 week before), skill check required / optional / off, accept similar needs as equivalent
- **Consent:** candidate shares a result with equivalent companies, candidate shows accepted stamps on the event card

⚠️ The shared database already uses the new design, so the **live site is broken** until item 1 is done and deployed.

## The list

### A. Finish the current change (makes the site work again)
- [ ] 1. Candidate pages: book a testing time (choose up to 3 needs → place → time), reschedule, cancel, see results
- [ ] 2. Kiosk pages: workstation screen ("reserved 13:00–13:30"), login, skill check, automatic logout
- [ ] 3. Company pages: **Accept / Not now / Ask the City**, confirm attendance, need settings + optional questions, similar needs
- [ ] 4. City pages: testing rooms and computers, enroll a computer, review queue, audit log
- [ ] 5. Event card page: accepted stamps only, candidate consent, no QR
- [ ] 6. Test everything (API + browser), commit, deploy

### B. UI
- [ ] 7. Go through every screen together: remove anything that is not needed, keep it minimal
- [ ] 8. Finnish and Swedish texts in the portals (landing is already done)

### C. Partner prizes
- [ ] 9. Gemini Pro as the thinking model (**needs GEMINI_API_KEY**)
- [ ] 10. Context.dev: company pastes website → AI drafts the need → company confirms (**needs CONTEXT_DEV_API_KEY**)
- [ ] 11. Modal: small code task for tech roles (optional, first to cut)

### D. Security and demo prep
- [ ] 12. Reset the Aiven password + IP allowlist (**Eduard, Aiven console**)
- [ ] 13. Different demo password on the live site, fresh demo data right before judging

### E. Submission (Sunday morning)
- [ ] 14. README for the repo
- [ ] 15. Verda process summary posted in their Discord channel (required for the Verda prize)
- [ ] 16. Pitch video, max 2:00
- [ ] 17. Pitch deck PDF (Prezi export tool)
- [ ] 18. Repo public
- [ ] 19. Submission form: main challenge + tech challenges (Verda, Gemma, Gemini, Modal, Context.dev, Aiven), set to FINAL before 10:00
