# Submission kit

Everything for Sunday morning. Live: https://skillcheck.fi · Demo: https://skillcheck.fi/en/demo · Code: https://github.com/Sairanyx/skill-check

## 1. The narrative (one sentence per beat)
1. **Problem:** since 2025 Espoo runs employment services for about 30,000 jobseekers. CVs and cover letters are now written by AI, and they show who you are, not what you can do.
2. **Idea:** no CV, no cover letter. A short skill check about a real company problem, taken in person in a City EXAM room, like the exam rooms Finnish universities use.
3. **Flow:** pick a City of Espoo event, pick the companies, see what each one asks for, get any required documents checked by the City, book one EXAM room visit.
4. **The check:** an AI panel interviews you in Finnish, Swedish or English. Before any AI sees your answers, a privacy guard on our own server in Finland removes names, employers, age and origin.
5. **Feedback, not a verdict:** the AI gives evidence-based feedback per skill, with your own words as proof. It shows whether you have the basics for the job. City staff check unclear cases. Companies decide whom to meet.
6. **Result:** accepted checks become badges on your event card and 15-minute meetings at the event.
7. **Why Espoo can trust it:** synthetic demo data, nothing decided by AI alone, every access logged, documents checked in person and never stored.

## 2. Video script (max 2:00)
Record the demo at /en/demo and talk over it. Click Next (or the arrow keys) when you are ready.

| Time | Screen | Say |
|---|---|---|
| 0:00 | Home page | "Espoo helps 30,000 jobseekers find work. Today CVs are written by AI and say little about real skills. SkillCheck: no CV, no cover letter, just talk about your skills." |
| 0:15 | Aino's dashboard, then an event | "Aino picks a City of Espoo recruitment event and the companies she wants to meet. Each company says what it needs. A bus company needs a licence, checked by City staff first. A data job can be booked right away." |
| 0:35 | Booking, EXAM room | "She books 30 minutes in a City EXAM room. In person, so nobody can use ChatGPT or answer for her." |
| 0:45 | The conversation | "Three Gemini 4 models interview her about a real problem from the company. Under every answer you see what the AI actually saw: her name, employer and age were removed first by Gemma, running on our own GPU server in Finland." |
| 1:05 | Feedback per skill | "The AI gives feedback per skill: what a strong answer shows, her own words as evidence, and the reasoning. It shows whether she has the basics. It is not a decision." |
| 1:20 | Company view | "The company sees an alias, never her name, and the evidence. They accept, and a 15-minute meeting is booked." |
| 1:35 | City view, documents, audit log | "The City of Espoo stays in control: it approves companies for events, checks documents in person, reviews unclear results, and every access is logged." |
| 1:50 | Event card with badge, then logo | "Aino gets a badge and a meeting. Talk about your skills, people decide. SkillCheck." |

## 3. Deck outline (8 slides)
1. **SkillCheck.** No CV. No cover letter. Just talk about your skills. (logo, skillcheck.fi)
2. **The problem.** 30,000 jobseekers in Espoo since TE24. AI-written CVs. Screening by CV favours names and fluent writing over skill.
3. **The idea.** Short in-person skill checks in City EXAM rooms, linked to City of Espoo recruitment events.
4. **How it works.** Event → companies → required documents checked by the City → EXAM room → AI interview → feedback → company decides → badge and meeting.
5. **Fair by design.** Privacy guard before any AI (Non-Discrimination Act categories), multilingual (fi/sv/en), feedback per skill with verified quotes, never scored on accent or grammar, people decide. In our judge tests: 82% agreement between models from three companies, no penalty for answering in a second language.
6. **Three sides.** Jobseekers, companies, City of Espoo (screenshots).
7. **Tech.** Gemini 4 panel (Hydrogen, Argon, Carbon), Gemma 4 26B privacy guard and Whisper large-v3-turbo on Verda GPUs in Finland, PostgreSQL on Aiven in Finland, Context.dev drafts company needs from their website, CI on CRACI with a dependency list (SBOM). Next.js, Rust.
8. **Next for Espoo.** Pilot in one EXAM room with 4 computers (about 50 checks a day), real-data fairness test, link to existing TalentMatch events. Team SkillCheck.

## 4. Junction submission form
**One-liner:** No CV, no cover letter: short in-person skill checks in City EXAM rooms, AI feedback that people check, and meetings at City of Espoo recruitment events.

**Tech challenges:** Gemini (interview panel), Gemma (privacy guard), Verda (GPU servers in Finland), Aiven (PostgreSQL), Context.dev (need drafts from websites), CRACI (CI and SBOM).

## 5. Verda Discord post (required for the Verda prize)
> **Team SkillCheck on Verda** 🇫🇮 We run every AI step that touches personal data on Verda in Finland: Whisper large-v3-turbo for speech in Finnish, Swedish and English, and Gemma 4 26B as a privacy guard that removes names, employers, age and origin before any other model sees an answer. vLLM on an A100 80GB, next to our Next.js app and Rust interview service. We also tested a second judge, Mistral Small 3.2 on an A100 40GB Spot instance, which had no outbound internet, so we downloaded the model once through the main server and ran it offline. Live: https://skillcheck.fi

## 6. Recording checklist
- [ ] Code freeze: no deploys while recording
- [ ] Browser: one clean window, zoom 110%, close other tabs
- [ ] Reload https://skillcheck.fi/en/demo, click Next when you are ready
- [ ] Record the screen (OBS or similar), voice separately if easier, keep under 2:00
- [ ] Export the deck to PDF
- [ ] Before 10:00: repo public, form set to FINAL, Verda post sent
