# Research

The evidence behind SkillCheck, with sources. Collected 14 Nov 2026. Vendor numbers are marked as such.

## Key facts
- **Since 1 Jan 2025 (TE24 reform), the City of Espoo is the employment authority for Espoo and Kauniainen, responsible for about 30,000 jobseekers.** Matching people to jobs is literally the City's job now. [Kauniainen](https://kauniainen.fi/en/news/te-services-will-become-municipal-services-on-1-january-2025) · [Työmarkkinatori](https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle)
- Espoo already finds candidates and lets employers choose. **SkillCheck gives that work evidence, scale and fairness.**
- "EXAM rooms for reasoning", using existing City spaces (libraries, Espoo Talent Hub).
- **Our own fairness test:** the same answers written in fluent and in non-native English scored **7.0 vs 6.7**. The scorer judges reasoning, not language.

## The problem we solve
- **Remote assessment is broken by AI cheating.** One vendor analysis of ~20,000 AI interviews flagged **38.5%** of candidates for cheating behaviour, **48%** for software roles (vendor data, indicative). [Fabric](https://fabrichq.ai/blogs/how-employers-are-trying-to-fight-cheating-during-interviews)
- **Google, McKinsey and Cisco brought back in-person rounds** because of AI cheating and impersonation. [Entrepreneur](https://www.entrepreneur.com/business-news/google-mckinsey-reintroduce-in-person-interviews-due-to-ai/496041) · [OECD AI incidents](https://oecd.ai/en/incidents/2025-08-12-0f22)
- Every commercial AI interviewer (HireVue, Sapia.ai, micro1, voice AI recruiters) is **remote**. [Sapia comparison](https://sapia.ai/resources/blog/ai-candidate-assessment-software/) · [HeroHunt](https://www.herohunt.ai/blog/best-ai-candidate-interviewers-2026/)

## Our answer: "EXAM rooms for reasoning"
- Finland already has **EXAM**: booked, supervised electronic exam rooms in **29 higher-education institutions** (run by CSC). Students book a time and get an **assigned computer**. Rooms are camera-monitored and the computers only run the exam system. [Aalto](https://www.aalto.fi/en/services/electronic-examinations-exam-service) · [UEF](https://kamu.uef.fi/en/?p=3531) · [Xamk](https://www.xamk.fi/?p=10624)
- Nobody applies this to recruitment. **The infrastructure already exists. SkillCheck uses it to check a reasoning baseline before the interview or the event.**
- ⚠️ Do not claim the rooms are "empty". Say "spare capacity outside exam periods" unless we get numbers from the City or a university.

## Why the method works
- **Structured interviews are the best single predictor of job performance**: ranked first in the 2022 re-analysis, above cognitive tests. Our skill check *is* a structured interview. [Sackett et al. 2022 via SIOP](https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance)
- **AI judges are biased by names.** LLMs rank identical CVs differently by name. [CUHK 2026 audit of 14 LLMs](https://arxiv.org/pdf/2606.28978) · [AIES 2024 coverage](https://getcoai.com/news/ai-models-prefer-white-and-male-job-candidates-new-study-finds) → our privacy guard runs **before** any scoring. **It is a fairness feature, not just privacy.**
- **Anonymous recruitment works when it is the default.** The **City of Helsinki pilot** (VATT/LABORE 2023): anonymisation increased hiring of applicants with foreign names, but opt-in by managers weakened it. [LABORE](https://labore.fi/en/publications/anatomy-of-an-anonymous-hiring-pilot/) → **anonymity is the default, companies cannot switch it off.**
- **Human in the loop alone is not enough.** Recruiters followed biased AI recommendations ~90% of the time (secondary source). [TechRepublic](https://www.techrepublic.com/article/ai-hiring-bias-research/) → we show **evidence and confidence**, and the City dashboard measures **how often people agree with the AI**.
- **Reliable AI judges need:** a clear rubric, quotes as evidence, calibration against human ratings, separate bias tests, regular human spot-checks. [MLflow](https://mlflow.org/articles/llm-judge-calibration/) · [guide](https://futureagi.com/blog/llm-as-judge-best-practices-2026) → we have rubric + evidence. Calibration and spot-checks are planned for a pilot.

## Rules and public sector
- **EU AI Act:** recruitment AI is high-risk. The Digital Omnibus moved those obligations from Aug 2026 to **2 Dec 2027**. SkillCheck is **built to be compliant before it is required.** [DLA Piper](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act) · [Cooley](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- **Public employment services:** France Travail uses AI for CV skills analysis. [OECD](https://read.oecd-ilibrary.org/en/about/programmes/sg-reform/improving-public-employment-services-through-artificial-intelligence-in-france-and-greece.html). The World Bank warns AI **cannot replace core skills assessment**, and Austria's AMS faced backlash over a discriminating chatbot. [World Bank](https://thedocs.worldbank.org/en/doc/98d7502c78085efeab2772e84e820572-0090012025/original/02-Use-of-data-and-AI-in-PES-May22.pdf) → "AI gathers evidence, people decide."
- **Roadmap:** stamps → **European Digital Credentials** (signed, machine-readable, linkable to ESCO skills). [Europass](https://europass.europa.eu/en/news/how-employers-can-use-european-digital-credentials-hiring)

## How buyers judge assessment tools
From a 2026 buyer's guide ([Sapia](https://sapia.ai/resources/blog/ai-candidate-assessment-software/), vendor source):
| Criterion | Our answer |
|---|---|
| Predictive validity | Structured-interview method (Sackett 2022). Pilot with Espoo to measure it |
| Fairness audit, explainability | Pseudonymised input, fairness agent, quotes per score, append-only audit log, counterfactual test bench (planned) |
| Depth of signal | Reasoning on the company's real problems, not a narrow coding test |
| Candidate experience | ~7 min per company, fi/sv/en, voice or text, no CV needed |
| Integrity / AI resistance | Booked City computer, kiosk lock, follow-up questions on the candidate's own answers |
| Connectivity | Platform API (`/api/v1`) with JWT for Brella, Tavata, other cities |

Comparison table of platforms (for the Q&A): Sapia.ai, HireVue, TestGorilla, Vervoe, Canditech, Criteria, SHL, Mercer Mettl, HackerRank, Codility/CodeSignal. All remote or proctored remotely. None is a public-sector, in-person, privacy-first model.

---

# Technical research: making the core pipeline better

## 1. Privacy guard
- Rule-based tools like **Presidio miss a lot** (recall 0.07 on high-sensitivity entities in the REDACT benchmark). LLMs do best. [REDACT](https://benchmarklist.com/benchmarks/redact/)
- **GLiNER2-PII** (May 2026): open 0.3B multilingual model, 42 PII types, top span-F1 on the SPY benchmark. Finnish/Swedish not proven, test before relying. [arXiv 2605.09973](https://arxiv.org/pdf/2605.09973)
- **Plan:** layers = known identity (we know the user's name and email, remove exactly) + patterns + GLiNER2-PII + Gemma, union of everything found.

## 2. Scoring (the evaluator)
- Industry pattern (Sapia, HireVue, HiPeople): **Behaviourally Anchored Rating Scales (BARS)**. Anchors per skill written in advance, then **extract evidence first, then score against the anchor, with a rationale**. [Sapia](https://sapia.ai/resources/blog/the-responsible-use-of-llms-in-structured-interviews/) · [HiPeople](https://docs.hipeople.io/en/articles/15550547-how-hipeople-s-ai-interviews-evaluate-candidates) · [HireVue](https://hirevuehelpcenter.zendesk.com/hc/en-us/articles/45490688965268-The-science-behind-AI-scored) · [AssemblyAI](https://www.assemblyai.com/blog/interview-scoring-system)
- Known failure modes of LLM interview scoring: scale collapse, test-retest unreliability, inter-model disagreement, question-type sensitivity, expectation gap (preprint, not peer-reviewed). [Preprints 202607.1567](https://www.preprints.org/manuscript/202607.1567)
- **Panel of judges (PoLL):** several smaller models from different families beat one large judge on agreement with humans and reduce self-preference. [Verga et al. 2024](https://arxiv.org/pdf/2404.18796)
- **Confidence:** LLM judges are overconfident. Self-reported confidence calibrated best in one 2026 grading study, but needs checking. [arXiv 2603.29559](https://www.alphaxiv.org/abs/2603.29559) · [arXiv 2510.00263](https://arxiv.org/pdf/2510.00263v1)
- **Plan:** BARS anchors per need → evidence per skill → score per skill → overall match computed in code (not guessed) → confidence from evidence coverage + agreement between judges.

## 3. Fairness testing
- **Counterfactual tests:** change only one thing (name, dialect) and check the score does not move. Same text in a non-standard dialect was rated lower by all 19 LLMs tested. [arXiv 2603.13891](https://arxiv.org/html/2603.13891v1) · [name-conditioned bias](https://arxiv.org/pdf/2604.19984)
- **Plan:** test bench with the same answers in fluent vs non-native Finnish/Swedish/English. Report the score difference. (Can run on Modal.)

## 4. Speech
- Finnish fine-tunes of Whisper: large-v3 Finnish WER about **10.4 → 8.2** on Common Voice (self-reported). [Finnish-NLP](https://huggingface.co:443/Finnish-NLP/whisper-large-finnish-v3) · turbo Finnish fine-tune [Mozilla.ai](https://hg.istephan-squireso.workers.dev/mozilla-ai/whisper-large-v3-turbo-fi/blob/main/README.md?code=true)

## 5. Kiosk lock
- **Safe Exam Browser (SEB):** locks the computer to one site, blocks shortcuts, uses a config file with an access key. Windows version is Chromium-based. [SEB](https://www.safeexambrowser.org/about_overview_en.html) · [manual](https://www.safeexambrowser.org/windows/win_usermanual_en.html)
- **Plan:** City computers run SEB (or ChromeOS / Chromium kiosk) pointed at SkillCheck. Our server can additionally check SEB's request header so checks only run from the official SEB setup.

---

# How the City of Espoo does it today (Nov 2026)

## Who is responsible
- Since **1 Jan 2025 (TE24 reform)** public employment services moved from the state to municipalities. **Espoo + Kauniainen form one employment area. The City of Espoo is the employment authority**, responsible for about **30,000 jobseekers**. [Kauniainen](https://kauniainen.fi/en/news/te-services-will-become-municipal-services-on-1-january-2025) · [Työmarkkinatori](https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle) · [Espoo: TE reform for employers](https://www.espoo.fi/en/working-life/business-espoo-helping-companies-thrive/apua-rekrytointiin/te-reform-what-do-businesses-and-employers-need-know)

## Services for employers
- **Free tailored candidate search:** Espoo Employment Services finds jobseekers who meet the employer's needs and **presents the best options. The employer makes the final selection**. [Espoo employer services](https://www.espoo.fi/en/ty%C3%B6nantajalle) · [Recruitment assistance](https://www.espoo.fi/en/business-espoo-helping-companies-thrive/recruitment-assistance-0)
- **Company visits ("Invite us for a visit"):** staff visit companies, learn their needs in conversation and uncover hidden openings. Employers were "delighted by how many talents are available". No numbers or screening method published. [Espoo news 2025/10](https://www.espoo.fi/en/news/2025/10/free-recruitment-help-sparks-interest-entrepreneurs-espoo-are-delighted-about-level-talent) · [2026/05](https://www.espoo.fi/en/news/2026/05/how-your-business-doing-invite-us-visit)
- **Recruitment subsidy:** €5,000 to employers who hire a young Espoo resident or an unemployed person who speaks a foreign language (from 3 Feb 2026). [Espoo](https://www.espoo.fi/en/rekrytointituki)
- **Business Espoo** network of six organisations (City, Enter Espoo, Federation of Espoo Enterprises, Helsinki Region Chamber of Commerce, Omnia, Espoo Regional Enterprise Agency).

## Events today
| Event | Format | How matching works |
|---|---|---|
| **TalentMatch** | Online or in person, English, free | Event platform with matching algorithms, **pre-screened profiles**, **15-minute 1:1 meetings only on mutual interest**. 200 to 1,000 jobseekers, 5 to 50 employers per event. [Espoo](https://www.espoo.fi/en/talentmatch-events) |
| **Työnantajatreffit** (employer meet-ups) | In person, sector-specific, e.g. construction at **Sello library** 9 Apr 2026, also Lippulaiva | Walk-in meetings with employers, free [Työmarkkinatori](https://tyomarkkinatori.fi/tapahtumat/tyonantajatreffit-maanrakennusala) |
| **Employer Speed Dating** | On-site, Espoo Talent Hub or online | International students and employers, with universities [Espoo](https://www.espoo.fi/en/working-life/espoo-talent-hub/employer-speed-dating) |
| Espoo Talent Hub | Tekniikantie 4 C, Otaniemi | Services for international professionals, Competence Centre for Highly Educated Immigrants |

## What this means for SkillCheck
- **Our model already matches how Espoo works:** the City finds and presents candidates, the employer decides (D11). We add **evidence of real skills** instead of self-written profiles, and **scale** it beyond manual visits (30,000 jobseekers).
- **The gap we fill:** today's profiles are pre-screened but self-reported, and needs are gathered by hand during visits. SkillCheck gives companies a 2-minute way to describe needs and gives staff comparable evidence.
- **Testing rooms can use existing City places:** Espoo already runs events in **libraries (Sello, Lippulaiva)** and **Espoo Talent Hub**. Library computer spaces + EXAM-style booking = testing rooms without new buildings.
- **Fits existing events:** TalentMatch already uses 15-min 1:1 meetings on mutual interest. Our stamps and evidence plug into that flow (and into whatever platform they use, via our API).
- **Link to the €5,000 subsidy:** the platform can tell a company when a candidate they accepted may make them eligible (young Espoo resident or foreign-language speaker), without showing the reason to anyone else.
- **Open questions for Espoo:** How do staff screen candidates today? Which event platform runs TalentMatch? How many staff hours does one event take? Would libraries or Talent Hub host testing rooms?

---

# Why the AI only ever sees pseudonymised answers: LLMs are biased

Large language models learn from human text, so they carry human prejudices, sometimes in stronger and more hidden forms. Evidence:

| Bias | Evidence | What SkillCheck does |
|---|---|---|
| **Names → race and gender** | LLMs rank identical CVs differently by name. Direction differs by model generation. [CUHK 2026 audit of 14 LLMs](https://arxiv.org/pdf/2606.28978) · [AIES 2024](https://getcoai.com/news/ai-models-prefer-white-and-male-job-candidates-new-study-finds) | Names, employers, schools, places removed before any agent reads the answer |
| **Dialect → "employability"** | Same content in a stigmatised dialect made models suggest less prestigious jobs. Larger models showed **more** hidden prejudice, and human-feedback training did not remove it. [Hofmann et al., Nature 2024](https://arxiv.org/abs/2403.00742) | Scoring prompts ignore grammar and style. Fairness agent checks for it. Our non-native test: 7.0 vs 6.7 |
| **Non-native writing** | AI detectors flagged **over half** of non-native English (TOEFL) essays as AI-written, one detector 98%. [Liang et al., Patterns 2023](https://arxiv.org/html/2304.02819v3) | We never use AI-text detectors. Integrity comes from the supervised testing room instead |
| **Age and gender** | Models assume women are younger and less experienced and rate older male applicants higher (Nature, Oct 2025). Age bias persists even under corrective instructions. [PMLR 2026](https://proceedings.mlr.press/v350/grenzebach26a.html) · [arXiv 2603.11736](https://arxiv.org/html/2603.11736v1) | Age signals (birth years, graduation years) removed. Gender not collected |
| **Judge biases** | LLM judges favour the first answer (position), longer answers (verbosity) and their own outputs (self-preference). [Zheng et al., NeurIPS 2023](https://arxiv.org/abs/2306.05685) | Each candidate scored alone against fixed anchors (no position effect), quotes not length, a second judge from another model family (planned with Gemini) |

**In short:** we do not trust the AI to be fair. We design it so it cannot see what it could be unfair about, and we check it anyway.

**Legal basis in Finland:** the **Non-Discrimination Act (Yhdenvertaisuuslaki 1325/2014)** forbids discrimination based on age, origin, nationality, language, religion, belief, opinion, political activity, trade union activity, family relationships, state of health, disability, sexual orientation or other personal characteristics. The **Equality Act (609/1986)** covers gender. The privacy guard removes exactly these. The same Act allows different treatment only for a **genuine and determining requirement of the work** that is proportionate, which is why a language requirement is optional, per need, and scored separately (DECISIONS D16). CEFR levels A1 to C2 match the Finnish YKI language certificate levels 1 to 6.
