# Handover: start here

Welcome. This page gets you from zero to productive. Read it top to bottom once (about 10 minutes).

## 1. The project in one minute
**Skill Check** is a platform for the **City of Espoo**'s recruitment events (Junction 2026 challenge "Rethinking Recruitment").
- Jobseekers book a 30-minute slot on a **City computer in a testing room** (like university EXAM rooms).
- On that locked computer, an AI interviewer asks ~6 questions about a real company need (fi / sv / en, voice or text).
- A **privacy guard** removes names, employers, schools and places **before** any AI scores the answers.
- An evaluator gives **match 0–10, confidence, level and question difficulty**, with quotes as evidence. A fairness agent checks for bias.
- **A person decides**: the company accepts (stamp on the event card, meeting at the event) or not. The AI never decides.
- Everything runs **in Finland**: Verda GPU server (Helsinki) + Aiven Postgres (Hamina).

Judging (Espoo): impact 45%, innovation & UX 35%, responsible & feasible 20%. No automated decisions about people.

## 2. Read these (in this order)
1. `docs/CHECKLIST.md`: **what is done and what is next** (we tick items off together)
2. `docs/REPOSITORY.md`: how the code is organised (layer diagram)
3. `docs/DATABASE.md`: the database, Postgres vs Aiven vs Drizzle, diagram of all tables
4. `docs/ARCHITECTURE.md`: diagrams, how the agents interact, where everything is in the repo, full API
5. `docs/SPEC.md` §8: product decisions we agreed on (exam rooms, consent, stamps, etc.)
6. `infra/README.md`: SSH, the database, deploy

## 3. Access you need (ask Eduard)
| What | How |
|---|---|
| GitHub `Sairanyx/skill-check` | Eduard adds you as collaborator. Work on branch **`dev`** |
| `.env.local` values | Eduard sends them **privately** (not via GitHub or public chat) |
| SSH to the Verda server | Send Eduard your `~/.ssh/id_ed25519.pub`, he adds it (see `infra/README.md`) |
| Verda console (optional) | Eduard invites you to project **Skill Check**. Also redeem your own €200 coupon **inside that project** |
| Aiven console (optional) | Eduard invites you to project `skill-check-db` |

## 4. Run it locally
```bash
git clone https://github.com/Sairanyx/skill-check.git && cd skill-check
git checkout dev
cp .env.example .env.local      # paste the values from Eduard
npm install
./infra/tunnel.sh               # AI models from the Verda server to localhost
npm run dev -- -p 3100          # http://localhost:3100
```

## 5. Try the whole flow (demo script)
Password for all demo accounts: `junction2026`

| Who | Email |
|---|---|
| Jobseeker | `aino@demo.skillcheck.fi` |
| Company (has its own questions) | `recruiter@kauklahtiparcel.demo` |
| Company (no questions, AI easy mode) | `recruiter@tapiolacloud.demo` |
| Company (no skill check needed) | `hello@kivenlahtibakery.demo` |
| City of Espoo | `events@espoo.demo` |

1. Fresh data with Aino booked **right now**: `npm run db:reset -- --yes && npm run db:seed`
2. Log in as **City** → Testing rooms → *Leppävaara, Workstation 1* → **Use this computer** (your browser becomes that kiosk) → Log out.
3. Log in as **Aino** on the kiosk page → Start → answer 6 questions (type, or the mic) → result.
4. Log in as **Kauklahti Parcel** → candidate list → open the result → **Invite to meet** (= accept).
5. Log in as **Aino** → the result shows the invite → book a meeting → **Event card** → consent → stamp.
6. Log in as **City** → numbers, review queue, **Audit log** (every access and decision, append-only).

Try breaking it: log in as another jobseeker on the kiosk (refused), log in on a normal browser and try to start a check (refused).

## 6. Where things are
| I want to change… | Look in |
|---|---|
| Tables | `src/db/schema.ts` then `npm run db:push` |
| Business rules (booking, kiosk, decisions, consent) | `src/lib/services/*.ts` |
| AI prompts | `src/lib/ai/interviewer.ts`, `evaluator.ts`, `guard.ts` |
| API | `src/app/api/v1/**/route.ts` (thin, call the services) |
| Pages | `src/app/[lang]/candidate`, `company`, `city`, `kiosk` |
| Shared UI pieces | `src/components/app/*` |
| Texts (en/fi/sv) | `src/i18n/dictionaries/*.json` |

This is **Next.js 16**: some APIs changed. Read `AGENTS.md` and `node_modules/next/dist/docs/` before guessing.

## 7. Team rules
- **Small commits, plain-English messages** ("Let companies confirm attendance…"), push to `dev`.
- **UI: very simple.** White + Finnish blue (`#003580`), one clear action per screen, no extra buttons.
- **Texts:** no em dashes or semicolons. Say data is processed **"in Finland"**, not "in Helsinki".
- **Never** say the AI "passes" or "rejects" someone. People decide. Stamps only after a company accepts.
- **Never commit secrets.** `.env.local` is ignored, `.env.example` is the template.
- Deploy with `./infra/deploy.sh` (ships only committed code).

## 8. Known issues
- Gemma 12B scores harshly and reports 100% confidence. Gemini Pro should fix it (waiting for the API key).
- One ESCO skill match is wrong ("root-cause analysis" → "present a cause").
- Dev console warns "uncached data during navigation" on some pages (pages still work).
- Portals are English only for now (landing page is translated).
- Aiven password appeared in a screenshot: reset it (Aiven console) and update `.env.local` + the server `.env`.
