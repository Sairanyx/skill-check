# Submission kit

Drafts for Sunday morning. Edit freely.

## 1. Junction submission form

**Name:** SkillCheck

**One-liner:** Show what you can do, not what an AI wrote for you. A fair, evidence-based skill check for the City of Espoo's recruitment events.

**Description:**
Since 2025 the City of Espoo is the employment authority for about 30,000 jobseekers. Employers drown in AI-written CVs, and CV screening favours names, schools and fluent writing over real skill.

SkillCheck replaces the CV with a short skill check about a real company problem. Jobseekers take it on a booked City computer in a testing room, so nobody can get help from ChatGPT or send someone else. An AI interviewer asks the questions in Finnish, Swedish or English. Before any AI scores the answers, a privacy guard on our own server in Finland removes names, employers, schools, places and everything the Non-Discrimination Act protects. A panel of three AI judges from different companies scores the answers against written anchors, with quotes checked against the real answers, and takes the median. Low confidence or a fairness flag sends the result to a City reviewer.

People decide. The City and the company accept or not. Companies see an alias until the jobseeker shares contact details. Official proofs (licences, hygiene passport, language certificates) are checked in person by City staff, so no CV or cover letter is needed. Accepted results become stamps on the event card and 15-minute meetings at Espoo's events.

In our benchmark the three judges agreed 82% of the time, and answering in a second language cost nothing.

**Links:** https://skillcheck.fi · https://github.com/Sairanyx/skill-check

**Tech challenges:**
- **Verda:** two GPU servers in Finland (A100 80GB: Gemma, Whisper, app. A100 40GB Spot: Mistral judge)
- **Gemma:** Gemma 4 26B is the privacy guard, fairness check and judge 1, on our own server
- **Gemini:** Gemini 3.8 Flash is the interviewer and judge 3 (pseudonymised text only)
- **Aiven:** PostgreSQL in Finland, append-only audit log
- **Context.dev:** drafts a company need from its website
- **CRACI / Modal:** if the teammate finishes tests in CI and the fairness bench

## 2. Verda Discord post (required for the Verda prize)

> **Team SkillCheck: how we used Verda** 🇫🇮
> We built a fair skill check for the City of Espoo. All AI that touches personal data runs on Verda in Finland.
> - **A100 80GB (FIN-01):** vLLM serving Gemma 4 26B (privacy guard, fairness check, judge) and Whisper large-v3-turbo (speech in Finnish, Swedish, English), plus our Next.js app behind Caddy HTTPS.
> - **A100 40GB Spot (FIN-01):** Mistral Small 3.2 24B as a second, independent judge.
> - **One lesson:** our Spot instances came up without outbound internet. We downloaded the model once through the main server (a temporary proxy over SSH), then ran Mistral fully offline, reachable only from the main server. That turned out to be a nice privacy feature.
> - **Result:** three judges from different companies, agreement 0.82, no score penalty for second-language answers.
> Live: https://skillcheck.fi · Code: https://github.com/Sairanyx/skill-check

## 3. Video script (max 2:00)

| Time | Screen | Voice |
|---|---|---|
| 0:00 to 0:15 | Landing page | "Since 2025 Espoo runs employment services for 30,000 jobseekers. Employers drown in AI-written CVs. CVs show who you are, not what you can do." |
| 0:15 to 0:35 | Aino books a testing time, kiosk | "With SkillCheck, Aino books 30 minutes on a City computer. No CV. The check only runs there, so nobody can use ChatGPT or send a friend." |
| 0:35 to 1:00 | Interview, "what the AI saw" | "Gemini asks about a real company problem, in Finnish, Swedish or English. Before any scoring, Gemma on our own server in Finland removes her name, employer and anything about age or origin." |
| 1:00 to 1:20 | Result with quotes and three judges | "Three judges, Gemma, Mistral and Gemini, score her answers against written anchors, with her own words as evidence. They agree 82% of the time, and answering in a second language cost nothing." |
| 1:20 to 1:40 | Company view, then City review and audit log | "The company sees an alias and the evidence, and decides. Unclear cases go to a City reviewer. Every access is logged." |
| 1:40 to 2:00 | Event card with stamp, logo | "Accepted results become stamps and meetings at Espoo's events. People decide, the AI brings evidence. SkillCheck: show what you can do." |

Exact models to say or show: Gemma 4 26B, Mistral Small 3.2 24B, Gemini 3.8 Flash, Whisper large-v3-turbo, on Verda in Finland.
