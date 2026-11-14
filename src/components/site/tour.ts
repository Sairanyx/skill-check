/** Guided demo: the story, step by step. Paths with :check, :event are filled in on the tour page. */
export type TourRole = "candidate" | "company" | "city" | null;
/** `highlight` is a CSS selector. Pages mark the parts the story points at with data-tour="…". */
export type TourStep = { path: string; as: TourRole; title: string; text: string; highlight?: string };
export type TourState = { mode: "watch" | "try"; step: number; steps: TourStep[]; lang: string };

export const TOUR_KEY = "sc_tour";
export const DEMO_ACCOUNTS: Record<Exclude<TourRole, null>, string> = {
  candidate: "aino@demo.skillcheck.fi",
  company: "recruiter@kauklahtiparcel.demo",
  city: "events@espoo.demo",
};
export const DEMO_PASSWORD = "junction2026";

// The story: the City sets up the event, a company says what it needs, Aino takes a check, then the results.
export const STORY: TourStep[] = [
  { path: "", as: null, title: "No CV. Just talk about your skills.", text: "Espoo serves about 30,000 jobseekers, and CVs are now often written by AI. SkillCheck replaces them with a short, supervised skill check about a real task.", highlight: "h1" },
  { path: "/city", as: "city", title: "The City of Espoo sets up an event", text: "The City creates a recruitment event, approves the companies that apply and runs the EXAM rooms.", highlight: "[data-tour=event]" },
  { path: "/company/needs/new", as: "company", title: "A company describes a real task", text: "Kauklahti Parcel describes one real problem, or pastes its website and AI drafts it. That is all a company has to do.", highlight: "main form" },
  { path: "/candidate/events/:event", as: "candidate", title: "Aino picks the companies she wants to meet", text: "Each company shows what it needs. Required licences are checked by City staff before she can book.", highlight: "[data-tour=company]" },
  { path: "/candidate/book?needs=:need", as: "candidate", title: "She books an EXAM room", text: "30 minutes on a City computer in a supervised room, like the EXAM rooms Finnish universities use.", highlight: "[data-tour=slots]" },
  { path: "/candidate/checks/:check", as: "candidate", title: "The skill check", text: "An AI panel asks about the company's real task, in Finnish, Swedish or English, by voice or text.", highlight: "[data-tour=turn]" },
  { path: "/candidate/checks/:check", as: "candidate", title: "Personal details removed first", text: "Name, employer, place and age are removed on a server in Finland before any AI reads the answer. This is exactly what the AI saw.", highlight: "[data-tour=ai-saw]" },
  { path: "/candidate/checks/:check", as: "candidate", title: "Feedback, not a verdict", text: "For each skill: what a strong answer shows, her own words as evidence, and the reasoning.", highlight: "[data-tour=feedback]" },
  { path: "/company/candidates/:check", as: "company", title: "The company accepts", text: "The company sees an alias and the evidence, never a name, and invites her to a 15-minute meeting at the event.", highlight: "[data-tour=candidate]" },
  { path: "/candidate/card", as: "candidate", title: "Aino gets a badge", text: "With her consent, the accepted check becomes a badge on her event card. She meets the company at the event.", highlight: "[data-tour=card]" },
  { path: "/city/audit", as: "city", title: "The City stays in control", text: "City staff review unclear results and check documents. Every access to personal data is logged. People decide, never the AI.", highlight: "main h1" },
  { path: "", as: null, title: "Try it yourself", text: "Take a skill check, or log in as Aino, the company or the City. The demo accounts are filled in.", highlight: "h1" },
];
