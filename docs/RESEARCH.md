# Research: evidence for the pitch and the demo

Collected 14 Nov 2026. Vendor numbers are marked as such. Use the wording below in the pitch.

## The problem we solve
- **Remote assessment is broken by AI cheating.** One vendor analysis of ~20,000 AI interviews flagged **38.5%** of candidates for cheating behaviour, **48%** for software roles (vendor data, indicative). [Fabric](https://fabrichq.ai/blogs/how-employers-are-trying-to-fight-cheating-during-interviews)
- **Google, McKinsey and Cisco brought back in-person rounds** because of AI cheating and impersonation. [Entrepreneur](https://www.entrepreneur.com/business-news/google-mckinsey-reintroduce-in-person-interviews-due-to-ai/496041) · [OECD AI incidents](https://oecd.ai/en/incidents/2025-08-12-0f22)
- Every commercial AI interviewer (HireVue, Sapia.ai, micro1, voice AI recruiters) is **remote**. [Sapia comparison](https://sapia.ai/resources/blog/ai-candidate-assessment-software/) · [HeroHunt](https://www.herohunt.ai/blog/best-ai-candidate-interviewers-2026/)

## Our answer: "EXAM rooms for reasoning"
- Finland already has **EXAM**: booked, supervised electronic exam rooms in **29 higher-education institutions** (run by CSC). Students book a time and get an **assigned computer**. Rooms are camera-monitored and the computers only run the exam system. [Aalto](https://www.aalto.fi/en/services/electronic-examinations-exam-service) · [UEF](https://kamu.uef.fi/en/?p=3531) · [Xamk](https://www.xamk.fi/?p=10624)
- Nobody applies this to recruitment. Pitch: **"The infrastructure already exists. We use it to check a reasoning baseline before the interview or the event, in person or online."**
- ⚠️ Do not claim the rooms are "empty". Say "spare capacity outside exam periods" unless we get numbers from the City or a university.

## Why the method works
- **Structured interviews are the best single predictor of job performance**: ranked first in the 2022 re-analysis, above cognitive tests. Our skill check *is* a structured interview. [Sackett et al. 2022 via SIOP](https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance)
- **AI judges are biased by names.** LLMs rank identical CVs differently by name. [CUHK 2026 audit of 14 LLMs](https://arxiv.org/pdf/2606.28978) · [AIES 2024 coverage](https://getcoai.com/news/ai-models-prefer-white-and-male-job-candidates-new-study-finds) → our privacy guard runs **before** any scoring. **It is a fairness feature, not just privacy.**
- **Anonymous recruitment works when it is the default.** The **City of Helsinki pilot** (VATT/LABORE 2023): anonymisation increased hiring of applicants with foreign names, but opt-in by managers weakened it. [LABORE](https://labore.fi/en/publications/anatomy-of-an-anonymous-hiring-pilot/) → **anonymity is the default, companies cannot switch it off.**
- **Human in the loop alone is not enough.** Recruiters followed biased AI recommendations ~90% of the time (secondary source). [TechRepublic](https://www.techrepublic.com/article/ai-hiring-bias-research/) → we show **evidence and confidence**, and the City dashboard measures **how often people agree with the AI**.
- **Reliable AI judges need:** a clear rubric, quotes as evidence, calibration against human ratings, separate bias tests, regular human spot-checks. [MLflow](https://mlflow.org/articles/llm-judge-calibration/) · [guide](https://futureagi.com/blog/llm-as-judge-best-practices-2026) → we have rubric + evidence. Calibration and spot-checks are on the checklist.

## Rules and public sector
- **EU AI Act:** recruitment AI is high-risk. The Digital Omnibus moved those obligations from Aug 2026 to **2 Dec 2027**. Pitch: **"Built to be compliant before it is required."** [DLA Piper](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act) · [Cooley](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- **Public employment services:** France Travail uses AI for CV skills analysis. [OECD](https://read.oecd-ilibrary.org/en/about/programmes/sg-reform/improving-public-employment-services-through-artificial-intelligence-in-france-and-greece.html). The World Bank warns AI **cannot replace core skills assessment**, and Austria's AMS faced backlash over a discriminating chatbot. [World Bank](https://thedocs.worldbank.org/en/doc/98d7502c78085efeab2772e84e820572-0090012025/original/02-Use-of-data-and-AI-in-PES-May22.pdf) → "AI gathers evidence, people decide."
- **Roadmap:** stamps → **European Digital Credentials** (signed, machine-readable, linkable to ESCO skills). [Europass](https://europass.europa.eu/en/news/how-employers-can-use-european-digital-credentials-hiring)

## How buyers judge assessment tools (use as our self-check)
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
- Known failure modes of LLM interview scoring: scale collapse, test–retest unreliability, inter-model disagreement, question-type sensitivity, expectation gap (preprint, not peer-reviewed). [Preprints 202607.1567](https://www.preprints.org/manuscript/202607.1567)
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
- **Plan:** City computers run SEB (or ChromeOS / Chromium kiosk) pointed at Skill Check. Our server can additionally check SEB's request header so checks only run from the official SEB setup.
