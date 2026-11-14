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
- **Industry:** studies keep finding that LLMs rank identical CVs differently by name (CUHK 2026 audit of 14 LLMs, AIES 2024), judge dialect and non-native writing more harshly (Nature 2024, Patterns 2023) and favour by age and gender. Full table: RESEARCH.md, "Why the AI only ever sees pseudonymised answers". Layered PII detection (rules + NER + LLM) beats rules alone (REDACT benchmark).
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

## D8. Scoring with behaviourally anchored rating scales (BARS) ✅ built
**Decision:** anchors per skill (what a 1 / 3 / 5 answer looks like, plus yes/no checklist items) are written when a need is created. The evaluator extracts **exact quotes** first (the code throws away any quote that is not really in the answers), scores each skill against its anchors in **two independent runs**, and the **code computes** the match (over skills actually shown), the level and the confidence (evidence coverage + agreement between runs).
- **Industry:** Sapia.ai, HireVue and HiPeople score with BARS and evidence quotes. Known LLM scoring failures: unstable repeat scores, scale collapse, overconfidence. Small yes/no judgements are more reliable than one big rating.
- **Measured (same answers, Gemma 26B):**

  | Answers | Before | After BARS |
  |---|---|---|
  | Strong | 3 to 6, inconsistent | **7.0** |
  | Strong, written in non-native English | – | **6.7** (fluency barely matters) |
  | Medium | – | **2.8** |
  | Weak | 1 | **2.3** |
  | Confidence | always 100% | 0.78–0.9, lower when skills were not shown |
  | Agreement between the two runs | – | 0.96–1.0 |
- **➕** Consistent, explainable (quote + reason per skill), defensible. Evidence can't be invented. Skills that were never asked don't lower the score.
- **➖** Anchors are AI-written (the company can review them). Still needs calibration against human recruiters' ratings in a pilot. Two scoring runs cost a few extra seconds.

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

## R1. Rejected: telling companies a hire may qualify for Espoo's €5,000 subsidy
**Idea:** when a company accepts someone, hint "this hire may qualify for the recruitment subsidy" (young Espoo resident or unemployed foreign-language speaker).
- **Why rejected:** the hint itself reveals age group or language background, which breaks the anonymity of D3 and can bias decisions in either direction. The Helsinki pilot shows anonymity only works when it cannot be bypassed.
- **Instead:** the City handles the subsidy after a hire, outside the platform, exactly as today.

## D13. Fail safe to a human
**Decision:** if any automatic safety step cannot run (for example the fairness agent returns an unreadable answer), the result is **not** released to companies. It goes to the City's human review queue with the flag "automatic fairness check could not run". Bad AI output is logged (length and edges only, no candidate text) so the cause can be found.
- **Industry / law:** "fail safe" is standard in safety engineering; the EU AI Act requires human oversight and robustness for high-risk systems.
- **Found in testing:** while generating 30 demo checks, the fairness agent once returned broken JSON twice. Replaying all 29 stored checks gave 0 failures, so the cause was rare (most likely an answer cut off at the length limit; the limit was doubled).
- **➕** No result ever skips the fairness check silently. Problems become visible instead of hidden.
- **➖** A few more items for City reviewers when the AI misbehaves.

## D14. One store for conversations: Postgres only
**Decision:** conversations are stored only in Postgres (Aiven, Finland). Audio is never stored.
- **➕** Data minimisation: one copy to secure, list in GDPR records and erase.
- **➖** Erased data stays in Aiven's encrypted backups until they expire (14 days). This must be stated in the privacy notice.

## D15. The privacy guard follows the Non-Discrimination Act, and hides revealing dates
**Decision:** the guard removes everything on the grounds protected by the **Non-Discrimination Act (1325/2014)** and the **Equality Act (609/1986)**: age, origin, nationality, mother tongue, religion, belief, opinion, political and union activity, family, health, disability, sexual orientation, gender. Calendar years that reveal age or life events ("born 1985", "graduated 1998", "moved here in 2022") become `[YEAR]`. **Durations stay** ("3 years of SQL", "a 6-month project"), and so do tools and versions ("Python 3.12").
- **Finland:** the Act lists exactly these grounds. A graduation year is a well-known proxy for age, an arrival year for origin.
- **Research:** LLMs change scores by name, dialect, age and gender (RESEARCH.md table). Removing the signal is more reliable than asking the model to ignore it.
- **Tested:** Finnish, Swedish and English sentences, about 0.3–0.5 s each on our own server.
- **➕** The categories are the law's, not our own invention. Easy to explain to the City's lawyers.
- **➖** Some context is lost ("experience since 2010" becomes "since [YEAR]"). Durations keep most of the value.

## D16. Optional language requirement per need, scored separately
**Decision:** a company may mark a language as a real requirement of the job, with a CEFR level (for example Swedish B2). Then the interviewer asks **one question in that language** (placed in code, always the third question), and a separate assessment gives a CEFR level with verified quotes: "Swedish, B2 required: B2, meets". **It is never part of the skill match.** All other scores keep ignoring grammar and fluency. Without a requirement, nothing changes.
- **Finland / law:** the Non-Discrimination Act allows different treatment when it is based on a **genuine and determining requirement of the work** and is proportionate. A blanket "fluent Finnish" demand for work that does not need it can be discrimination, so the requirement is per need, optional, and shown openly. CEFR is the scale Finland already uses: the national language certificate **YKI** has levels 1–6 that match A1–C2.
- **Industry:** job ads in Finland commonly name a language level. The usual problem is that it is checked by gut feeling in the interview, mixed with everything else.
- **Tested:** a strong answer in Swedish was rated B2 (meets), a broken one A1 (below). The skill match came from the content only.
- **➕** Honest about what the job needs. Keeps the language judgement visible and separate instead of hidden inside every score. Swedish-speaking Espoo customers are a real need (Espoo is bilingual).
- **➖** One question is a small sample, so it is evidence for a person, not a certificate. Companies could over-ask: the City sees which needs set a requirement and can question it.
