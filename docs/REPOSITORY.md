# Repository structure

## Layers

Every feature passes through the same layers. Pages and API routes stay thin, the rules live in **services**, so the web portals, the kiosk and external systems all follow the same rules.

```mermaid
flowchart TB
  subgraph Clients["Clients"]
    direction LR
    C1["Jobseeker portal<br/><code>app/[lang]/candidate</code>"]
    C2["Company portal<br/><code>app/[lang]/company</code>"]
    C3["City portal<br/><code>app/[lang]/city</code>"]
    C4["Testing-room kiosk<br/><code>app/[lang]/kiosk</code>"]
    C5["External systems<br/>JWT / bearer token"]
  end

  subgraph Edge["Edge"]
    direction LR
    P["<code>proxy.ts</code><br/>language routing"]
    A["<code>lib/api.ts</code> · <code>lib/session.ts</code><br/>authentication · role checks · errors"]
  end

  subgraph API["Platform API"]
    R["<code>app/api/v1/**/route.ts</code><br/>thin HTTP handlers"]
  end

  subgraph Domain["Domain services · <code>lib/services</code>"]
    direction LR
    S1["checks"]
    S2["testing<br/>(bookings, kiosk)"]
    S3["company<br/>(attendance, equivalence)"]
    S4["decisions"]
    S5["privacy · audit<br/>(GDPR)"]
  end

  subgraph AI["AI pipeline · <code>lib/ai</code>"]
    direction LR
    W["transcribe<br/>Whisper"]
    G["guard<br/>pseudonymise"]
    I["interviewer"]
    E["evaluator +<br/>fairness auditor"]
    L["llm<br/>Gemma / Gemini switch"]
  end

  subgraph Data["Data · <code>db/</code>"]
    D[("Postgres (Aiven, Finland)<br/><code>schema.ts</code>")]
  end

  Clients --> Edge --> API --> Domain
  Domain --> AI
  Domain --> Data
  I & E --> L
```

## Folders

| Path | Layer | Contents |
|---|---|---|
| `src/app/[lang]/` | Clients | All pages, served under `/en`, `/fi`, `/sv`. One folder per role, plus `kiosk/`, `login/`, `signup/` |
| `src/app/api/v1/` | API | Platform API. Folder = URL, `route.ts` = handler. Calls services only |
| `src/app/actions/` | API | Server actions for forms (log in, sign up, log out, kiosk login rule) |
| `src/proxy.ts` | Edge | Redirects visitors to their browser language |
| `src/lib/api.ts` | Edge | Wraps API routes: identifies the caller, checks the role, returns clean JSON errors |
| `src/lib/session.ts` | Edge | `requireRole()` protects a page in one line |
| `src/lib/auth.ts` | Edge | Better Auth setup: email login, server-set roles, JWT + bearer tokens |
| `src/lib/services/` | Domain | Business rules: `checks`, `testing`, `company`, `decisions`, `needs`, `privacy`, `audit` |
| `src/lib/ai/` | AI | `transcribe`, `guard`, `interviewer`, `evaluator`, `llm` |
| `src/lib/esco.ts` | AI / open data | Maps company skills to the EU ESCO taxonomy |
| `src/db/` | Data | `schema.ts` (all tables), `seed.ts`, `reset.ts`, `sql/` (audit triggers) |
| `src/components/ui/` | Clients | Base UI components (shadcn/ui) |
| `src/components/app/` | Clients | Skill Check components: check runner, evidence view, decision panel, kiosk guard |
| `src/i18n/` | Clients | Texts in English, Finnish and Swedish |
| `infra/` | Operations | `docker-compose.yml` (Gemma, Whisper, app, Caddy), `Caddyfile`, `deploy.sh`, `tunnel.sh`, server guide |
| `Dockerfile` | Operations | Production image of the web app |
| `docs/` | Documentation | Handover, checklist, architecture, spec, research, this file |

## One feature through the layers: "start a skill check"

```mermaid
sequenceDiagram
  autonumber
  participant K as Kiosk page<br/>kiosk-start.tsx
  participant R as API route<br/>api/v1/checks/route.ts
  participant A as lib/api.ts
  participant S as Service<br/>services/checks.ts
  participant T as Service<br/>services/testing.ts
  participant I as AI<br/>ai/interviewer.ts
  participant D as Database

  K->>R: POST /api/v1/checks {needId, language}
  R->>A: caller(req, ["candidate"])
  A-->>R: logged-in jobseeker
  R->>S: startCheck(user, needId, language, kioskToken)
  S->>T: assertKioskTurn: booked computer, right now?
  T-->>S: workstation + appointment
  S->>I: nextQuestion(need, language, [])
  I-->>S: first question + difficulty
  S->>D: insert skill_check, audit "check.started"
  S-->>K: checkId + first question
```

## Conventions
- Routes never contain business rules. They authenticate, parse input and call a service.
- Services never read cookies or headers directly. Request data (like the kiosk token) is passed in.
- Every access to personal data writes an audit record (`services/audit.ts`).
- AI calls go through `lib/ai/llm.ts`, so the model can be switched with one setting.
