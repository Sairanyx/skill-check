/** Guided demo: the story, step by step. Paths with :check, :event are filled in on the tour page. */
export type TourRole = "candidate" | "company" | "city" | null;
export type TourStep = { path: string; as: TourRole; title: string; text: string; tag?: string; evidence?: string; highlight?: string; seconds?: number };
export type TourState = { mode: "watch" | "try"; step: number; steps: TourStep[]; lang: string };

export const TOUR_KEY = "sc_tour";
export const DEMO_ACCOUNTS: Record<Exclude<TourRole, null>, string> = {
  candidate: "aino@demo.skillcheck.fi",
  company: "recruiter@kauklahtiparcel.demo",
  city: "events@espoo.demo",
};
export const DEMO_PASSWORD = "junction2026";

export const STORY: TourStep[] = [
  { path: "", as: null, tag: "Impact & Relevance · 45%", title: "No CV. Just talk about your skills.", evidence: "Since the TE24 reform (Jan 2025), the City of Espoo is the employment authority for about 30,000 jobseekers.", text: "Recruitment events receive many applications, often AI-written and not a good fit. SkillCheck replaces the CV with a short, supervised skill check about a real task, so suitable candidates are found quickly and at low cost.", highlight: "h1", seconds: 12 },
  { path: "/candidate/events/:event", as: "candidate", tag: "Innovation & UX · 35%", title: "Pick an event and companies", evidence: "Structured interviews are the best single predictor of job performance, ahead of CVs (Sackett et al., 2022).", text: "Aino chooses an event and the companies she would like to meet. Each company lists what it needs. Required licences are verified by City staff before booking.", highlight: "aside", seconds: 11 },
  { path: "/candidate/checks/:check", as: "candidate", tag: "Innovation & UX · 35%", title: "A structured interview", evidence: "Remote AI interviews are easy to cheat: one analysis of about 20,000 flagged 38.5%. Finnish universities already use supervised EXAM rooms.", text: "A structured interview led by an AI panel, about a real task from the company. In Finnish, Swedish or English, in a supervised City EXAM room.", highlight: "main h1", seconds: 11 },
  { path: "/candidate/checks/:check", as: "candidate", tag: "Responsible & Feasible · 20%", title: "Pseudonyms before any AI", evidence: "Language models rank identical CVs differently by name (audit of 14 LLMs, 2026). Helsinki\'s anonymous recruitment pilot raised hiring of applicants with foreign names (VATT 2023).", text: "Before any AI reads an answer, personal details such as name, employer, age and origin are removed on a server in Finland. The view below each answer shows exactly what the AI received.", highlight: "p.rounded-lg.bg-muted", seconds: 12 },
  { path: "/candidate/checks/:check", as: "candidate", tag: "Responsible & Feasible · 20%", title: "Feedback, not a verdict", evidence: "People tend to follow AI recommendations, even biased ones, so we show the evidence behind every score.", text: "For each skill: what a strong answer shows, quotes from her answers, and the reasoning. The feedback indicates whether the basics are in place. Decisions stay with people.", highlight: "section h2", seconds: 11 },
  { path: "/company/candidates/:check", as: "company", tag: "Impact & Relevance · 45%", title: "The company sees skills, not names", evidence: "Anonymous recruitment works best when it is the default, not opt-in (City of Helsinki pilot).", text: "Companies describe a real task, or let AI draft it from their website. They see an alias and the evidence, not a name, and invite suitable candidates to a 15-minute meeting.", highlight: "main h1", seconds: 11 },
  { path: "/city", as: "city", tag: "Responsible & Feasible · 20%", title: "Real, and ready to pilot", evidence: "We tested different AI setups: a three-model interview panel, and judges from three companies that agreed 82% with no penalty for second-language answers. Recruitment AI is high-risk under the EU AI Act, so human oversight and logging are built in.", text: "It builds on existing City services: EXAM rooms as used by Finnish universities, employment service points and TalentMatch events. The City approves companies, verifies documents and reviews unclear results. Every access is logged. A pilot needs one room with four computers.", highlight: "main h1", seconds: 12 },
  { path: "", as: null, tag: "Your turn", title: "Explore it yourself", text: "Log in as Aino, as the company or as the City of Espoo. The demo accounts are filled in.", highlight: "h1", seconds: 0 },
];
