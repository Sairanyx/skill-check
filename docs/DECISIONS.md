# Decision log

Every important design choice, with the research behind it (Finland first), how the industry does it today, and honest pros and cons. Sources are in `docs/RESEARCH.md`.

---

## D1. Skill checks only in City testing rooms, on a booked computer
**Decision:** jobseekers book a 30-minute slot on a specific City computer (kiosk). Only that person can log in there, only during the slot.
- **Finland:** the **EXAM** system already runs booked, supervised exam rooms with assigned computers in **29 Finnish higher-education institutions** (CSC). We reuse the model for recruitment.
- **Industry:** AI interviewers (HireVue, Sapia.ai, micro1) are remote. Remote assessment is struggling with AI cheating (vendor data: 38.5% of interviews flagged), and Google, McKinsey and Cisco brought back in-person rounds.
- **➕** Strongest protection against ChatGPT help and impersonation. Equal conditions for everyone. Uses existing public infrastructure.
- **➖** Travel and time for the jobseeker. Needs rooms and staff. Accessibility arrangements needed (extra time, assistive tech). → kept short (30 min), reschedulable, no no-show penalty.

## D2. Pseudonymise every answer before any AI scores it
**Decision:** a privacy guard (patterns + Gemma on our server) replaces names, employers, schools, places and contact details with tags before the agents see the text.
- **Finland:** the **City of Helsinki anonymous recruitment pilot** (VATT/LABORE 2023) increased hiring of applicants with foreign names.
- **Industry:** studies keep finding that LLMs rank identical CVs differently by name (CUHK 2026 audit of 14 LLMs, AIES 2024). Layered PII detection (rules + NER + LLM) beats rules alone (REDACT benchmark).
- **➕** Fairness (the scorer cannot be swayed by a name or a famous employer) and privacy (raw text never leaves Finland).
- **➖** A redaction can miss something (we show the candidate exactly what the AI saw). Tags can remove useful context ("worked at a large logistics company"). It is pseudonymisation, not anonymisation: still personal data under GDPR.

## D3. Companies never see identity; the City holds it
**Decision:** companies see a generated alias, scores, evidence and pseudonymised answers. Contact details only if the candidate shares them. The City can reveal identity only with a recorded reason.
- **Finland:** the Helsinki pilot found anonymity works when it is **mandatory**; when managers could opt in, self-selection weakened it.
- **Industry / law:** GDPR data minimisation; blind-hiring practice; EU AI Act transparency and human oversight for recruitment AI (high-risk, obligations from 2 Dec 2027).
- **➕** Companies decide on how people think, not who they are. Jobseekers control who can contact them. The City, already the public employment service, is the trusted middle.
- **➖** Companies lose the ability to pre-screen by CV and may feel less in control. At the in-person meeting identity is visible anyway, so anonymity protects step 1, not the whole process.

## D4. AI gathers evidence, people decide
**Decision:** the AI gives match, level, confidence and quotes. Only a person (company, or City reviewer) accepts, declines or releases a result. Stamps exist only after a company accepts.
- **Finland / public sector:** the World Bank warns AI cannot replace core skills assessment in public employment services; Austria's AMS chatbot faced backlash over discrimination.
- **Industry:** recruiters followed biased AI recommendations about 90% of the time in one study, so a human in the loop alone is not enough.
- **➕** Legally safer (no automated decisions about people). We show evidence, not just a number, and measure how often people agree with the AI.
- **➖** Slower than full automation. People can still rubber-stamp; we track "decisions matching AI" to spot that.

## D5. Structured, adaptive interview instead of CVs
**Decision:** about 6 questions about the company's real problem, following up on each answer, with difficulty moving one step up or down.
- **Research:** structured interviews are the best single predictor of job performance (Sackett et al. 2022). Adaptive testing (CAT) is standard in modern assessment.
- **➕** Measures reasoning on the actual job, hard to fake with a pasted answer because questions follow up.
- **➖** Adaptive questions make candidates' interviews less identical, which reduces comparability. → same rubric per need, difficulty recorded per question.

## D6. Open models on our own server in Finland (Gemma 26B + Whisper)
**Decision:** Gemma 4 26B-A4B (Google DeepMind, open) and Whisper (OpenAI, open) run on a Verda GPU in Helsinki. Upgraded from Gemma 12B after tests.
- **Finland:** Verda is a Finnish AI cloud on renewable energy. Data residency matters for a Finnish municipality.
- **Industry:** "sovereign AI" and self-hosted open-weight models for sensitive data.
- **Test result (12B → 26B):** strong vs weak answers separated clearly (9 vs 1), better ESCO matching, better Finnish questions.
- **➕** No candidate data goes to an external AI company. The City controls the infrastructure.
- **➖** We run and pay for a GPU. Open models are weaker than the largest closed models; confidence is still poorly calibrated (fix: D8).

## D7. Gemini as an optional second brain, on pseudonymised text only
**Decision:** the 3 agents can switch to Gemini with one setting. In production via Vertex AI in an EU region. Free-tier key only with synthetic demo data.
- **Industry:** a panel of judges from different model families agrees with humans better than one judge (Verga et al. 2024, "PoLL").
- **➕** Stronger reasoning and Finnish/Swedish. A second, independent judge.
- **➖** Text leaves Finland (pseudonymised). Dependency on a US vendor. → "sovereign mode" (Gemma only) stays the default option for the City.

## D8. Scoring with behaviourally anchored rating scales (BARS), planned
**Decision:** anchors per skill written in advance; the evaluator extracts evidence, scores each skill against its anchors, and the overall match is computed in code. Confidence is computed from evidence coverage and agreement, not self-reported.
- **Industry:** Sapia.ai, HireVue and HiPeople all score with BARS and evidence quotes. Known LLM scoring failures: unstable repeat scores, scale collapse, overconfidence.
- **Observed in our tests:** skill scores 3/2/2/4/4 with an overall "6"; good answers scored 3 at high difficulty; confidence always 100%.
- **➕** Consistent, explainable, defensible scores.
- **➖** Anchors take effort to write (generated by AI, glanced at by the company). Still needs calibration against human ratings.

## D9. Opt-in "accepted" stamps on the event card, no QR
**Decision:** the card shows only stamps from companies that accepted the result, and only if the candidate agrees.
- **EU:** Europass European Digital Credentials (signed, machine-readable, linked to ESCO skills) are the roadmap for a verifiable version.
- **➕** Motivating and visible, never shows failures.
- **➖** Can create a two-class feeling at the event (with and without stamps). → opt-in, positive only, no score shown.

## D10. Transferable checks between similar needs
**Decision:** the platform suggests similar needs (shared ESCO skills); a company accepts them as equivalent; the candidate consents to sharing.
- **EU:** ESCO is the EU's common skills language, already used by Europass and EURES.
- **➕** Fewer repeated tests for jobseekers, more candidates for companies.
- **➖** "Similar" is not "the same". → the company decides, and the candidate decides whether to share.

## D11. Both the City and the company can accept
**Decision:** the City decides by default; the company can also decide. Accepted = the company accepted, or the City accepted and the company did not decline. A company "no" only affects that company.
- **Finland:** the challenge says companies are hard to engage and doubt the City's candidate pool. The City runs employment services, so it can carry the matching work while companies keep control over who they meet.
- **Industry:** most AI hiring tools leave every decision to the employer; public employment services usually pre-select. We combine both.
- **➕** Minimal work for companies (the City's decision stands if they do nothing). Companies keep control of their own time. "Yes" from either side leans toward giving people a chance.
- **➖** More work for City staff. Two decision-makers can disagree; the rule above settles it, and the candidate never sees a "no" from anyone in public.

## D12. Skill check per company and per event, open events allowed
**Decision:** each company chooses per event: skill check required / optional / not needed. The City can make a whole event open (no skill checks). Stamps on the lanyard card show who verified the person for which company.
- **➕** Fits every kind of employer (a bakery does not need a reasoning check). At open events the stamp still helps: people walk up to any company, and companies that care can see who is verified.
- **➖** A stamp can feel like an advantage others don't have. → stamps are opt-in, positive only, and the skill check is free and bookable for everyone.
