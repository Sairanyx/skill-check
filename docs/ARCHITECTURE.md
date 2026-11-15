# Architecture

SkillCheck has two apps in this repository, built around the same interview panel and the same privacy guard.

- **Platform** (repository root): portals for jobseekers, companies and the City of Espoo. Events, bookings, skill checks, results, decisions and the audit log.
- **Demo** (`demo/`): a short story of how it works, a live skill check and finished results, for judges and visitors.

## 1. System

```mermaid
flowchart LR
  subgraph People
    J[Jobseeker]
    C[Company]
    E[City of Espoo staff]
  end

  subgraph Verda["Verda GPU servers, Finland"]
    APP["Platform<br/>Next.js, 3 portals, /api/v1"]
    PANEL["Interview panel<br/>Rust service"]
    G["Gemma 4 26B<br/>privacy guard"]
    W["Whisper large-v3-turbo<br/>speech to text"]
  end

  subgraph Aiven["Aiven PostgreSQL, Finland"]
    DB[("users, events, needs<br/>skill checks, evaluations<br/>decisions, audit log")]
  end

  GEM["Gemini 4 Hydrogen, Argon, Carbon<br/>reads pseudonymised text only"]

  J & C & E --> APP
  APP --> W
  APP --> G
  APP --> PANEL
  PANEL --> GEM
  APP --> DB
  PANEL --> DB
```

Everything personal stays in Finland. Gemini only ever reads answers after the privacy guard. Raw answers stay in our database.

## 2. One skill check

```mermaid
sequenceDiagram
  autonumber
  actor J as Jobseeker
  participant App as Platform
  participant W as Whisper (Finland)
  participant G as Gemma privacy guard (Finland)
  participant P as Panel: Gemini 4 Hydrogen, Argon, Carbon
  actor Co as Company
  actor E as City staff

  J->>App: Start the check in a supervised EXAM room
  App->>P: The company task and the rules
  P-->>J: First question (fi, sv or en)
  loop until the panel has heard enough
    J->>App: Answer by voice or text
    App->>W: Audio, if voice
    W-->>App: Text the candidate can correct
    App->>G: The answer
    G-->>App: Same answer with [NAME], [EMPLOYER], [PLACE], [YEAR] instead of details
    App->>P: Pseudonymised answer
    P-->>J: Next question
  end
  P-->>App: Verdicts of all three, skills with quotes, agreement
  alt The panel disagrees
    App->>E: Review first
  end
  App->>Co: Alias, evidence and the pseudonymised transcript
  Co->>App: Invite to a sit-down, or not now (logged)
  App->>J: Sit-down at the event and a SkillCheck badge, with consent
```

## 3. Who decides

```mermaid
flowchart LR
  A["Answer"] --> G["Gemma removes personal details"]
  G --> P["Three Gemini 4 models score the skills"]
  P --> R["Result with quotes and agreement"]
  R --> H{"People decide"}
  H -->|Company| S["Sit-down at the event"]
  H -->|City staff| V["Review unclear results"]
  R -. never .-> X["Automatic accept or reject"]
```

The AI gathers evidence. The company and the City decide. Every decision and every access to personal data is written to an append-only audit log.

## 4. The panel

| Model | Role |
|---|---|
| Gemini 4 Hydrogen | Lead interviewer, job knowledge |
| Gemini 4 Argon | Problem solving, how the candidate reasons |
| Gemini 4 Carbon | Authenticity, real experience |

After every answer each model writes a private note and proposes a question. One of them asks the next question. The interview ends when the panel can assess every skill, within a set limit of questions. Agreement between the three becomes the confidence. A split panel suggests a human review.

## 5. Where things are

| Area | Where |
|---|---|
| Platform pages and portals | `src/app/[lang]` |
| Business rules | `src/lib/services` |
| Privacy guard, speech, panel client | `src/lib/ai` |
| Database tables | `src/db/schema.ts` and [DATABASE.md](DATABASE.md) |
| Interview panel service | `panel/` and [PANEL_API.md](PANEL_API.md) |
| Demo server and front end | `demo/` and [demo/SERVER_API.md](../demo/SERVER_API.md) |
| Servers and deploy | `infra/` |
| Decisions and research | [DECISIONS.md](DECISIONS.md), [RESEARCH.md](RESEARCH.md) |
