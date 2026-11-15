# Research

The evidence behind SkillCheck. Collected 14 Nov 2026. Vendor numbers are marked as such.

## 1. Espoo today

| Fact | Source |
|---|---|
| Since 1 Jan 2025 (TE24 reform) the City of Espoo is the employment authority for Espoo and Kauniainen, about **30,000 jobseekers** | [Työmarkkinatori](https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle) · [Kauniainen](https://kauniainen.fi/en/news/te-services-will-become-municipal-services-on-1-january-2025) |
| Espoo finds candidates for employers and **the employer makes the final choice** | [Recruitment assistance](https://www.espoo.fi/en/business-espoo-helping-companies-thrive/recruitment-assistance-0) |
| **TalentMatch** events: 200 to 1,000 jobseekers, 5 to 50 employers, 15-minute meetings on mutual interest | [Espoo](https://www.espoo.fi/en/talentmatch-events) |
| Employer meet-ups are held in **Sello and Lippulaiva libraries** | [Työmarkkinatori](https://tyomarkkinatori.fi/tapahtumat/tyonantajatreffit-maanrakennusala) |
| **Espoo Talent Hub** (Otaniemi) runs employer speed dating | [Espoo](https://www.espoo.fi/en/working-life/espoo-talent-hub/employer-speed-dating) |
| €5,000 recruitment subsidy for hiring a young Espoo resident or an unemployed foreign-language speaker | [Espoo](https://www.espoo.fi/en/rekrytointituki) |

SkillCheck follows how Espoo already works: Espoo presents candidates, the employer decides. It adds evidence of real skills instead of self-written profiles.

## 2. The problem

- **CVs and remote interviews are easy to fake with AI.** One analysis of about 20,000 AI interviews flagged **38.5%** of candidates for cheating, 48% in software roles (vendor data). [Fabric](https://fabrichq.ai/blogs/how-employers-are-trying-to-fight-cheating-during-interviews)
- **Google, McKinsey and Cisco brought back in-person rounds** because of AI cheating and impersonation. [Entrepreneur](https://www.entrepreneur.com/business-news/google-mckinsey-reintroduce-in-person-interviews-due-to-ai/496041)
- **Commercial AI interviewers are all remote** (HireVue, Sapia.ai, micro1). [Sapia](https://sapia.ai/resources/blog/ai-candidate-assessment-software/)

## 3. Why in person, in existing rooms

- **29 Finnish universities** already run booked, supervised EXAM rooms with an assigned computer that only runs the exam. [Aalto](https://www.aalto.fi/en/services/electronic-examinations-exam-service) · [UEF](https://kamu.uef.fi/en/?p=3531)
- Espoo already hosts recruitment events in libraries and Espoo Talent Hub. A supervised computer there needs no new building.

## 4. Why the method works

| Finding | Source | What SkillCheck does |
|---|---|---|
| Structured interviews about the job are the **best single predictor** of job performance | [Sackett et al. 2022](https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance) | A structured conversation about one real task |
| Scoring is more reliable with **written anchors and evidence** | [Sapia](https://sapia.ai/resources/blog/the-responsible-use-of-llms-in-structured-interviews/) · [HiPeople](https://docs.hipeople.io/en/articles/15550547-how-hipeople-s-ai-interviews-evaluate-candidates) | Anchors per skill, quotes as evidence, quotes checked in code |
| A **panel of models** agrees with humans better than one large judge | [Verga et al. 2024](https://arxiv.org/pdf/2404.18796) | Three Gemini 4 models judge separately, agreement becomes confidence |
| People tend to **follow AI recommendations**, even biased ones | [TechRepublic](https://www.techrepublic.com/article/ai-hiring-bias-research/) | Every score shows its evidence, a split panel goes to a person |

## 5. AI is biased, so it never sees who you are

| Bias | Evidence | What SkillCheck does |
|---|---|---|
| **Names** | Models rank identical CVs differently by name. [CUHK audit of 14 LLMs, 2026](https://arxiv.org/pdf/2606.28978) | Names, employers, schools and places removed before any model reads an answer |
| **Dialect** | The same content in a stigmatised dialect gets lower job suggestions, more so in larger models. [Hofmann et al., Nature 2024](https://arxiv.org/abs/2403.00742) | Grammar and accent never count |
| **Non-native writing** | AI detectors flagged over half of non-native English essays as AI-written. [Liang et al., Patterns 2023](https://arxiv.org/html/2304.02819v3) | No AI detectors. Integrity comes from the supervised room |
| **Age and gender** | Models rate older men higher and assume women are less experienced. [PMLR 2026](https://proceedings.mlr.press/v350/grenzebach26a.html) | Birth and graduation years removed. Gender never collected |
| **Judges** | Model judges favour position, length and their own outputs. [Zheng et al., NeurIPS 2023](https://arxiv.org/abs/2306.05685) | Fixed anchors, quotes not length, three models |

**Anonymity works when it is the default.** In the City of Helsinki pilot, anonymisation raised hiring of applicants with foreign names, and opt-in by managers weakened it. [VATT and LABORE 2023](https://labore.fi/en/publications/anatomy-of-an-anonymous-hiring-pilot/) In SkillCheck companies cannot switch it off.

In an earlier test of our scorer, the same answers in fluent and in non-native English scored 7.0 and 6.7.

## 6. Law

- **Non-Discrimination Act (1325/2014)** and **Equality Act (609/1986).** The privacy guard removes exactly the protected grounds: age, origin, nationality, language, religion, belief, opinion, political and union activity, family, health, disability, sexual orientation and gender. A language requirement is allowed only when the job truly needs it, so it is optional per job and scored separately.
- **GDPR.** Data minimisation, data in Finland, export and erasure for every jobseeker.
- **EU AI Act.** Recruitment AI is high-risk, with obligations from 2 Dec 2027. Human oversight and logging are built in now. [DLA Piper](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act)
- **Public employment services.** The World Bank warns AI cannot replace core skills assessment. [World Bank](https://thedocs.worldbank.org/en/doc/98d7502c78085efeab2772e84e820572-0090012025/original/02-Use-of-data-and-AI-in-PES-May22.pdf) In SkillCheck the AI gathers evidence and people decide.
