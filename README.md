<p align="center"><img src="public/logo.svg" alt="SkillCheck" height="56"></p>

<p align="center"><b>Show what you can do, not what an AI wrote for you.</b><br>
A fair, evidence-based skill check for the City of Espoo's recruitment events.<br>
Junction 2026 · City of Espoo challenge "Rethinking Recruitment" · Team SkillCheck</p>

<p align="center"><a href="https://skillcheck.fi"><b>skillcheck.fi</b></a> (live demo, synthetic data only)</p>

---

## The problem
Since 1 January 2025 the City of Espoo is the employment authority for about 30,000 jobseekers. Employers drown in AI-written CVs and cover letters, and screening by CV favours names, schools and fluent writing over real skill.

## What SkillCheck does
1. **A jobseeker books 30 minutes on a City computer in a testing room** (like the EXAM rooms Finnish universities use). The check only runs there: no ChatGPT help, no impersonation.
2. **An AI interviewer asks about a real company problem**, in Finnish, Swedish or English, by voice or text, and adapts the difficulty.
3. **A privacy guard on our own server in Finland removes names, employers, schools, places, revealing dates and everything the Non-Discrimination Act protects**, before any AI scores the answers.
4. **A panel of AI judges from three different companies scores the answers** against written anchors, with quotes checked against the real answers. A fairness agent checks for bias. Low confidence goes to a City reviewer.
5. **No CV, no cover letter.** Only official proofs the job needs (licence, hygiene passport, language certificate), checked in person by City staff.
6. **People decide.** The City and the company accept or not. Companies see an alias, never a name, until the jobseeker shares contact details. Accepted results become stamps on the event card, and 15-minute meetings at the event.

## Models
| Job | Model | Made by | Runs on |
|---|---|---|---|
| Speech to text | Whisper large-v3-turbo | OpenAI (open weights) | Verda A100 80GB, Finland |
| Privacy guard, fairness check, judge 1 | Gemma 4 26B-A4B-it | Google (open weights) | Verda A100 80GB, Finland |
| Judge 2 | Mistral Small 3.2 24B Instruct | Mistral AI, France (open weights) | Verda A100 40GB, Finland |
| Interviewer, judge 3 | Gemini 3.8 Flash | Google | Google cloud (pseudonymised text only) |

All open models are served with vLLM. The final score is the median of the three judges, and disagreement lowers the confidence. Why each choice was made, with the research behind it: [docs/DECISIONS.md](docs/DECISIONS.md).

## Responsible by design
- **No automated decisions about people.** The AI gives evidence and confidence. A person decides.
- **Fairness:** pseudonymisation before scoring, scoring that ignores grammar and accent, a separate optional language score only when the job truly needs it, a fairness agent, and a judge panel against self-preference bias.
- **Privacy (GDPR):** data and models in Finland, companies see aliases only, contact by consent, identity revealed only by the City with a recorded reason, append-only audit log, export and erasure for every jobseeker, results deleted after 12 months.
- **Fail safe:** if any automatic check cannot run, the result goes to a person.

## Tech
Next.js 16, React 19, TypeScript, Tailwind, Better Auth, Drizzle ORM, PostgreSQL on **Aiven** (Finland), vLLM on **Verda** GPUs (Finland), **Gemma**, **Gemini**, Mistral, Whisper, ESCO skills taxonomy, **Context.dev** (drafts a company need from its website).

## Run it
```bash
git clone https://github.com/Sairanyx/skill-check.git && cd skill-check
cp .env.example .env.local      # database, model servers and API keys
npm install
npm run db:push && npm run db:seed && npm run db:demo   # tables, demo data, 30 AI-scored jobseekers
npm run dev -- -p 3100
```
`npm run demo:now` books the demo jobseeker into the testing slot running right now. Server setup: [infra/README.md](infra/README.md).

## Docs
| | |
|---|---|
| [Handover](docs/HANDOVER.md) | Start here |
| [Decisions](docs/DECISIONS.md) | Every design choice, research, pros and cons |
| [Research](docs/RESEARCH.md) | Facts and sources |
| [Architecture](docs/ARCHITECTURE.md) | Diagrams, agents, API, capacity |
| [Database](docs/DATABASE.md) | All tables and how personal data is protected |
| [Repository](docs/REPOSITORY.md) | How the code is organised |
| [Questions for Espoo](docs/QUESTIONS_FOR_ESPOO.md) | What we would ask the City next |

All companies and people in the demo are fictional. MIT licence.
