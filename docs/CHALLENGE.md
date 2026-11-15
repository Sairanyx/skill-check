# The challenge

**Rethinking Recruitment**, by the City of Espoo, Junction 2026.

> How can recruitment and matchmaking events organised by the City of Espoo help companies and talent find and connect with each other, despite AI-generated job search materials and AI-assisted recruitment processes becoming common?

## What Espoo sees today

- Companies describe their needs late and vaguely.
- Organisers receive many applications but cannot see real capabilities.
- Companies get overwhelmed by irrelevant approaches at events.
- CVs are written by AI and read by AI, so decisions rest on synthetic material.

**Ground rules:** synthetic data, minimal personal data, no automated decisions about people, privacy in line with the EU AI Act.

## Our answer

### 1. The EXAM room filters first

Before the event, each jobseeker talks through a real task from the company on a supervised computer in an EXAM room, in spaces Espoo already uses. No CV, no phone, nobody else. The check **filters out candidates who cannot yet show the skills, before the events**, so companies spend the event with the people who can.

### 2. A panel of three Gemini 4 models

Big tech interviews care about how a person solves problems. SkillCheck asks the same of three models working as one panel.

| Model | Looks at | Weight |
|---|---|---|
| **Gemini 4 Carbon** | Real experience: what is true, not what only sounds right | 1.5× |
| **Gemini 4 Hydrogen** | Job knowledge | 1× |
| **Gemini 4 Argon** | How the candidate reasons | 1× |

**How the interview runs**
- After every message all three write a private note: how they read it and how ready they are to score.
- Carbon asks the next question. Clarifying questions are free, because asking well is a skill.
- Off-topic replies, fishing for answers and stalling use up a limited budget.
- The interview ends when the weighted readiness reaches 85 out of 100, after at least three real answers, and never runs past 30 messages.

**The result**
- Each model gives its verdict independently, then the verdicts are combined with the same weights.
- A score per skill, with the candidate's exact words. Quotes the candidate never said are removed by code.
- Strengths, gaps, what to ask face to face, and feedback for the candidate.
- Nothing is a black box: staff can read the whole conversation and every note the panel wrote.

**Hard to fool.** We tried to pass without knowing the subject and the panel kept asking until it was clear. Anyone can try to break it.

### 3. Gemma removes personal details first

Before any Gemini model reads an answer, Gemma 4 on our server in Finland replaces names, age, employers, places and origin with tags. The panel only ever sees the skill.

### 4. People decide

Companies see an alias and the evidence, and invite people to sit down at the event. An accepted check becomes a SkillCheck badge.

## How it meets the judging criteria

| Criterion | Weight | SkillCheck |
|---|---|---|
| **Impact and relevance** | 45% | The EXAM room check filters before the event, so companies meet the people who show the skills. It follows how Espoo already works: Espoo presents candidates, the employer decides. |
| **Innovation and user experience** | 35% | No CV. A conversation about a real task with a panel of three Gemini 4 models, in Finnish, Swedish or English, in rooms Espoo already has. |
| **Responsible and feasible execution** | 20% | Gemma removes personal details in Finland first. People decide, every access is logged, data stays in Finland. Runs on existing spaces and a working platform. |

Sources: [RESEARCH.md](RESEARCH.md). Design choices: [DECISIONS.md](DECISIONS.md).
