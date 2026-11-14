/** Guided demo: the story, step by step. Paths with :check, :event are filled in on the tour page. */
export type TourRole = "candidate" | "company" | "city" | null;
export type TourStep = { path: string; as: TourRole; title: string; text: string; highlight?: string; seconds?: number };
export type TourState = { mode: "watch" | "try"; step: number; steps: TourStep[]; lang: string };

export const TOUR_KEY = "sc_tour";
export const DEMO_ACCOUNTS: Record<Exclude<TourRole, null>, string> = {
  candidate: "aino@demo.skillcheck.fi",
  company: "recruiter@kauklahtiparcel.demo",
  city: "events@espoo.demo",
};
export const DEMO_PASSWORD = "junction2026";

export const STORY: TourStep[] = [
  { path: "", as: null, title: "Welcome to SkillCheck", text: "The City of Espoo runs recruitment events for about 30,000 jobseekers. SkillCheck replaces the CV with a short skill check in a City EXAM room. Three sides use it: jobseekers, companies and the City. Let's follow Aino.", highlight: "h1" },
  { path: "/candidate", as: "candidate", title: "Aino, a jobseeker", text: "Aino logs in. She starts from the City's recruitment events: in person, online or hybrid.", highlight: "a[href*='/candidate/events/']" },
  { path: "/candidate/events/:event", as: "candidate", title: "She picks companies", text: "Each company says what it needs. A skill check, a language level, or documents the City must check first, like a bus licence. Aino ticks a data job, which she can book right away.", highlight: "aside", seconds: 12 },
  { path: "/candidate/book?needs=:need", as: "candidate", title: "She books an EXAM room", text: "30 minutes on a City computer in an EXAM room, like the exam rooms at Finnish universities. Nobody can use ChatGPT or answer for her.", highlight: "h2" },
  { path: "/candidate/checks/:check", as: "candidate", title: "The skill check", text: "An AI panel interviews her about a real problem from the company. Under each answer you see what the AI actually saw: her name, employer and year were removed first, on our own server in Finland.", highlight: "p.text-right", seconds: 14 },
  { path: "/candidate/checks/:check", as: "candidate", title: "The feedback", text: "Scores per skill, with her own words as evidence. It shows whether she has the basics for the job. It is feedback, not a decision.", highlight: "section h2", seconds: 12 },
  { path: "/candidate/card", as: "candidate", title: "Her badge", text: "The company accepted her. With her consent, the result becomes a badge on her event card, and she has a 15-minute meeting at the event.", highlight: "main" },
  { path: "/company", as: "company", title: "The company's view", text: "Kauklahti Parcel sees an alias, never Aino's name or photo. The AI feedback helps them see who has the basics, and they decide whom to meet.", highlight: "table" },
  { path: "/company/candidates/:check", as: "company", title: "Evidence, not a CV", text: "Per skill: a score, the reason, and quotes checked against her real answers. The company accepts, and the meeting is booked.", highlight: "section", seconds: 12 },
  { path: "/company/needs/:need", as: "company", title: "Setting up a job", text: "Companies describe a real problem, the documents and language level they truly need, and their own questions. Questions and scoring rules are checked for bias before use.", highlight: "form" },
  { path: "/city", as: "city", title: "The City of Espoo", text: "The City approves companies for events, reviews unclear results, checks documents at the desk and runs the EXAM rooms.", highlight: "section" },
  { path: "/city/audit", as: "city", title: "Every access is logged", text: "Who saw which data, when and why. The City can reveal an identity only with a recorded reason.", highlight: "main" },
  { path: "", as: null, title: "That's SkillCheck", text: "No CV, no cover letter. A short, fair skill check, AI feedback that people check, and meetings at City of Espoo events. Now try it yourself with the demo accounts.", highlight: "h1" },
];
