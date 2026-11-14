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
  { path: "", as: null, tag: "Impact & Relevance · 45%", title: "No CV. Just talk about your skills.", evidence: "Since the TE24 reform (Jan 2025), the City of Espoo is the employment authority for about 30,000 jobseekers.", text: "Espoo serves about 30,000 jobseekers. CVs are now written by AI. SkillCheck replaces them with a short skill check about a real company problem, taken in person in a City EXAM room.", highlight: "h1", seconds: 12 },
  { path: "/candidate/events/:event", as: "candidate", tag: "Innovation & UX · 35%", title: "Pick an event and companies", evidence: "Structured interviews are the best single predictor of job performance, ahead of CVs (Sackett et al., 2022).", text: "Aino picks a City of Espoo event and the companies she wants to meet. She sees what each asks for. Required licences are checked by City staff before she can book.", highlight: "aside", seconds: 11 },
  { path: "/candidate/checks/:check", as: "candidate", tag: "Innovation & UX · 35%", title: "An AI panel interviews her", evidence: "Remote AI interviews are easy to cheat: one analysis of about 20,000 flagged 38.5%. Finnish universities already use supervised EXAM rooms.", text: "Three Gemini 4 models interview her about a real problem, in Finnish, Swedish or English. In an EXAM room, so nobody can use ChatGPT or answer for her.", highlight: "main h1", seconds: 11 },
  { path: "/candidate/checks/:check", as: "candidate", tag: "Responsible & Feasible · 20%", title: "Pseudonyms before any AI", evidence: "Language models rank identical CVs differently by name (audit of 14 LLMs, 2026). Helsinki\'s anonymous recruitment pilot raised hiring of applicants with foreign names (VATT 2023).", text: "Gemma on our own server in Finland removes her name, employer, age and origin first. Below each answer you see exactly what the AI saw.", highlight: "p.rounded-lg.bg-muted", seconds: 12 },
  { path: "/candidate/checks/:check", as: "candidate", tag: "Responsible & Feasible · 20%", title: "Feedback, not a verdict", evidence: "People tend to follow AI recommendations, even biased ones, so we show the evidence behind every score.", text: "Per skill: what a strong answer shows, her own words as evidence, and the reasoning. It shows whether she has the basics. People decide.", highlight: "section h2", seconds: 11 },
  { path: "/company/candidates/:check", as: "company", tag: "Impact & Relevance · 45%", title: "The company sees skills, not names", evidence: "Anonymous recruitment works best when it is the default, not opt-in (City of Helsinki pilot).", text: "Kauklahti Parcel sees an alias and the evidence, never her name or photo. They accept, and a 15-minute meeting at the event is booked.", highlight: "main h1", seconds: 11 },
  { path: "/city", as: "city", tag: "Responsible & Feasible · 20%", title: "The City stays in control", evidence: "Recruitment AI is high-risk under the EU AI Act (obligations from Dec 2027): human oversight, logging and transparency are built in.", text: "Espoo approves companies, checks documents in person, reviews unclear results and sees an audit log of every access. A pilot needs one EXAM room with 4 computers.", highlight: "main h1", seconds: 12 },
  { path: "", as: null, tag: "Your turn", title: "Explore it yourself", text: "Log in as Aino, as the company, or as the City of Espoo. Demo accounts are filled in for you.", highlight: "h1", seconds: 0 },
];
