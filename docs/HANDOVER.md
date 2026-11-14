# Handover: start here

Welcome! This page gets you from zero to productive in about 15 minutes. Status: **Saturday 14 Nov, 16:00**.
Submission: **Sunday 15 Nov, 10:00** (video ≤ 2 min, deck PDF, public repo, form set to FINAL). Peer review Sun 10:30 to 14:00, everyone attends.

**Live site:** https://skillcheck.fi (password for every demo account: `junction2026`)

## 1. The project in one minute
**SkillCheck** is a platform for the **City of Espoo**'s recruitment events (Junction challenge "Rethinking Recruitment"). Since 2025 Espoo is the employment authority for ~30,000 jobseekers.
- Jobseekers book a 30-minute slot on a **City computer in a testing room** (like university EXAM rooms). The check only runs there: no cheating with ChatGPT, no impersonation.
- An **AI interviewer** asks ~6 questions about a real company need (Finnish, Swedish or English, voice or text).
- A **privacy guard** removes names, employers, schools, places, dates that reveal age, and everything the Non-Discrimination Act protects, **before** any AI scores the answers.
- A **panel of AI judges** scores the answers against written anchors (BARS) with verified quotes. A fairness agent checks for bias. Low confidence or a flag sends it to a City person.
- **No CV, no cover letter.** Only official proofs the job needs (licence, hygiene passport, language certificate), checked in person by City staff.
- **People decide.** City and company accept or not. Companies see an alias, never a name. The AI never decides.
- Everything runs **in Finland**: two Verda GPU servers + Aiven Postgres.

Judging: impact 45%, innovation and UX 35%, responsible and feasible 20%.

## 2. Exact models (say these exactly in the deck and video)
| Job | Model | Made by | Runs on |
|---|---|---|---|
| Speech to text | **Whisper large-v3-turbo** | OpenAI (open weights) | Verda A100 80GB, FIN-01 |
| Privacy guard, interviewer, evaluator, fairness check, judge 1 | **Gemma 4 26B-A4B-it** | Google (open weights) | Verda A100 80GB, FIN-01 |
| Judge 2 | **Mistral Small 3.2 24B Instruct** | Mistral AI, France (open, Apache 2.0) | Verda A100 40GB Spot, FIN-01 (**not running yet**, see §6) |
| Judge 3 (optional) | **Gemini 3.8 Flash** (or Gemini 4) | Google | Google cloud, hackathon key |
| Serving | **vLLM** v0.33.0 | open source | both Verda servers |

## 3. Read these (in this order)
1. `docs/CHECKLIST.md`: what is done and what is next. **Your items are marked "Teammate".**
2. `docs/DECISIONS.md`: every design choice with the research behind it (D1 to D18). Good pitch material.
3. `docs/REPOSITORY.md`: how the code is organised (layers diagram).
4. `docs/ARCHITECTURE.md`: diagrams, agents, full API, capacity estimate.
5. `docs/DATABASE.md`: all 27 tables.
6. `docs/RESEARCH.md`: facts for the pitch (with sources).
7. `infra/README.md`: SSH, database, deploy.

## 4. Access (ask Eduard)
| What | How |
|---|---|
| GitHub `Sairanyx/skill-check` | Collaborator. Work on branch **`dev`** |
| `.env.local` values | Eduard sends them **privately**, never in GitHub or public chat |
| SSH to the Verda server | Send Eduard your `~/.ssh/id_ed25519.pub` |
| Verda console | Project **Skill Check** (the credits live in that project) |
| Aiven console | Project `skill-check-db` |

## 5. Run it locally
```bash
git clone https://github.com/Sairanyx/skill-check.git && cd skill-check
git checkout dev
cp .env.example .env.local      # paste the values from Eduard
npm install
./infra/tunnel.sh               # brings the AI models from the Verda server to localhost
npm run dev -- -p 3100          # http://localhost:3100
```
Laptop and live site share **the same database**, so be careful with `db:reset`.

## 6. What is new today, and what is blocked
| Feature | State | Where |
|---|---|---|
| Privacy guard aligned with the Non-Discrimination Act, dates → `[YEAR]`, durations kept | ✅ live | `src/lib/ai/guard.ts`, D15 |
| Language requirement per job (CEFR), one question in that language, own score, never in the match | ✅ live | `interviewer.ts`, `evaluator.ts` (`assessLanguages`), D16 |
| Official proofs: jobseeker adds, City desk verifies, company sees "Verified by the City" | ✅ live | `src/lib/proofs.ts`, `services/proofs.ts`, `/candidate/proofs`, City page, D17 |
| Panel of judges, median per skill, disagreement lowers confidence | ✅ code done, **live uses Gemma only** | `evaluator.ts` (`scorePanel`), `llm.ts`, setting `JUDGES` |
| Benchmark: judges compared, native vs non-native gap | ✅ script, **not run yet** | `npm run bench:panel` |
| Mistral judge server | ⛔ **blocked**: the Verda Spot instance has no internet (Verda support contacted) | `infra/judge/` (`setup.sh <ip>`) |
| Domain `skillcheck.fi` | ✅ live, www and the old verda.run address redirect | `infra/Caddyfile` |

**Gemini credits are limited.** Do not run `bench:panel` or set `JUDGES=…,gemini` without asking Eduard first. The hackathon Google account is deleted the day after the event.

## 7. Try the whole flow
| Who | Email |
|---|---|
| Jobseeker | `aino@demo.skillcheck.fi` (30 more: `jobseeker01…30@demo.skillcheck.fi`) |
| Company with its own questions | `recruiter@kauklahtiparcel.demo` |
| Company, Finnish + Swedish B2 required | `recruiter@health.demo` |
| Company, no skill check, hygiene passport required | `hello@kivenlahtibakery.demo` |
| City of Espoo | `events@espoo.demo` |

1. **City** → Testing rooms → *Leppävaara, Workstation 1* → **Use this computer** (your browser becomes the kiosk) → log out.
2. **Aino** on the kiosk → Start → answer 6 questions → result.
3. **Kauklahti Parcel** → candidate list → open the result → **Invite to meet**.
4. **Aino** → book a meeting → **Event card** → consent → stamp. Also **Proofs** → add a hygiene passport.
5. **City** → "Proofs to check at the desk" → **Verified**. Numbers, review queue, **Audit log**.
6. **Matinkylä Health** → open a candidate → see "Language for this job" and "Official proofs".

Try breaking it: another jobseeker on the kiosk (refused), starting a check in a normal browser (refused).

Fresh demo data: `npm run db:fresh` (~5 min, runs 30 AI interviews on the GPU). **Ask Eduard first**, it wipes the shared database.

## 8. Where things are
| I want to change… | Look in |
|---|---|
| Tables | `src/db/schema.ts`, then `npm run db:push` |
| Business rules | `src/lib/services/*.ts` |
| AI prompts and scoring | `src/lib/ai/interviewer.ts`, `evaluator.ts`, `guard.ts`, `rubric.ts` |
| Model providers, judges | `src/lib/ai/llm.ts` (settings `JUDGES`, `GEMINI_MODEL`, `MISTRAL_BASE_URL`) |
| API | `src/app/api/v1/**/route.ts` (thin, they call services) |
| Pages | `src/app/[lang]/candidate`, `company`, `city`, `kiosk` |
| Shared UI | `src/components/app/*` |
| Texts (en/fi/sv) | `src/i18n/dictionaries/*.json` |
| Demo data | `src/db/seed.ts` (base), `src/db/seed-demo.ts` (30 jobseekers through the real AI) |

This is **Next.js 16**: some APIs changed. Read `AGENTS.md` and `node_modules/next/dist/docs/` before guessing. After adding a page, run `npx next typegen`.

## 9. Good tasks for tonight (from the checklist)
1. **Automated tests** (item 12): Vitest unit tests (score computation, accept rule, kiosk rules, pseudonymisation patterns) and API tests. Example API test scripts exist, ask Eduard.
2. **CRACI** (12b): run tests + lint + typecheck + build in GitHub Actions on CRACI runners (tech-challenge prize).
3. **Company screens** (11): edit anchors and question bank, accept similar needs (backend exists).
4. **Mobile and accessibility** check (14).
5. **Mistral judge**: when Eduard has a working Verda instance, `JUMP=root@65.108.32.183 ./infra/judge/setup.sh <ip>`, then add the printed settings to the server `.env`.

## 10. Team rules
- **Small commits, plain-English messages** ("Let City staff verify proofs at the desk"), push to `dev`. No AI co-author lines.
- **UI: very simple.** White + Finnish blue `#003580`, one clear action per screen, no filler.
- **Texts:** no em dashes or semicolons. Data is processed **"in Finland"**.
- **Never** say the AI "passes" or "rejects" someone. People decide.
- **Every decision needs research behind it.** Add it to `docs/DECISIONS.md` (Finland, industry, pros and cons).
- **Never commit secrets.** `.env.local` is ignored, `.env.example` is the template.
- Deploy: `./infra/deploy.sh` (ships only committed code to https://skillcheck.fi).

## 11. Known issues
- The Mistral judge server has no internet (Verda side). If not fixed, delete it and deploy a new Spot instance.
- **Aiven password** was exposed in a screenshot earlier: must be reset before the repo goes public.
- One ESCO skill match is wrong ("root-cause analysis" → "present a cause").
- Portals are English only (the landing page is translated). fi/sv texts are on the checklist.
- Dev console warns "uncached data during navigation" on some pages (pages still work).
