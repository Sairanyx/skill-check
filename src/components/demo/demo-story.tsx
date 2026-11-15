"use client";

import { useActionState, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Building2, Landmark, MessagesSquare, User } from "lucide-react";
import { startDemoCheck, type DemoState } from "@/app/actions/demo";
import { Redacted } from "@/components/app/redacted";

export type Story = {
  event: { title: string; startsAt: string; companies: number; joining: { name: string; mode: "required" | "optional" | "off" }[] } | null;
  need: { company: string; title: string; summary: string; skills: string[] };
  room: { startsAt: string; endsAt: string; room: string; venue: string; workstation: string } | null;
  turns: { question: string; said: string; seen: string }[];
  evaluation: { match: number; level: string; confidence: number; skills: { skill: string; score: number; quote: string | null }[] } | null;
  alias: string;
  decision: { accepted: boolean; note: string | null } | null;
  meeting: { startsAt: string; room: string } | null;
  log: { at: string; role: string; action: string; purpose: string | null }[];
};
/** The four places in the big picture. Each zoomed-in step lights up the ones it is about. */
type Place = "jobseeker" | "exam" | "company" | "city";
type Ref = { text: string; source: string; href?: string };
type Step = { title: string; text: string; view: string; places: Place[]; refs: Ref[]; screen: ReactNode; map?: false };

const at = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
/** Keeps the demo short: cut at a word boundary. */
const short = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, text.lastIndexOf(" ", max))}…`);
const time = (iso: string, withDay = true) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Helsinki", hour: "2-digit", minute: "2-digit", ...(withDay ? { weekday: "short", day: "numeric", month: "short" } : {}) });

const PLACES: Record<Place, { label: string; icon: typeof User; origin: string }> = {
  city: { label: "City of Espoo", icon: Landmark, origin: "50% 5%" },
  company: { label: "Company", icon: Building2, origin: "88% 60%" },
  jobseeker: { label: "Jobseeker", icon: User, origin: "12% 60%" },
  exam: { label: "EXAM room + AI", icon: MessagesSquare, origin: "50% 60%" },
};
const PLATFORM = [
  { as: "candidate", label: "Jobseeker" },
  { as: "company", label: "Company" },
  { as: "city", label: "City of Espoo" },
] as const;

/** The demo: the problem, the big picture, then a zoom into each part, then a real skill check. */
export function DemoStory({ lang, story, tryNeeds }: { lang: string; story: Story | null; tryNeeds: { id: string; title: string; company: string }[] }) {
  const steps = buildSteps(story);
  const last = steps.length; // the "Try it" step comes after the story
  const [i, setI] = useState(0);
  const go = useCallback((n: number) => setI(Math.max(0, Math.min(last, n))), [last]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [i, go]);

  const step = steps[i];
  const zoomFrom = step?.places.length === 1 ? PLACES[step.places[0]].origin : "50% 40%";
  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Demo</p>
        <h1 className="mt-1 text-4xl tracking-tight md:text-5xl">SkillCheck in two minutes</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          SkillCheck is a working platform with portals for jobseekers, companies and the City of Espoo. This demo follows one story with synthetic data, then lets you take a real skill check.
        </p>
        <PlatformLinks lang={lang} className="mt-3" />
      </header>

      <nav aria-label="Demo steps" className="mt-10 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${last + 1}, minmax(0, 1fr))` }}>
        {[...steps.map((s) => s.title), "Your turn"].map((t, n) => (
          <button key={t} onClick={() => go(n)} aria-current={n === i ? "step" : undefined} aria-label={n < last ? `Step ${n + 1}: ${t}` : t} className="group text-left">
            <span className={`block h-1.5 rounded-full transition-colors duration-500 ${n <= i ? "bg-primary" : "bg-tint group-hover:bg-primary/40"}`} />
            <span className={`mt-2 hidden text-xs md:block ${n === i ? "font-semibold text-primary" : "text-muted-foreground"}`}>{n < last ? n + 1 : "Your turn"}</span>
          </button>
        ))}
      </nav>

      <section key={i} className="mt-8 grid gap-10 rounded-xl bg-surface p-6 md:grid-cols-[2fr_3fr] md:p-10">
        {step ? (
          <>
            <div className="demo-rise">
              <p className="text-sm font-semibold text-primary">{i + 1} / {last}</p>
              <h2 className="mt-2 text-3xl tracking-tight">{step.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-foreground/85">{step.text}</p>
              <ul className="mt-6 space-y-3">
                {step.refs.map((r, n) => (
                  <li key={r.text} className="demo-rise border-l-2 border-primary pl-3 text-sm text-muted-foreground" style={at(0.5 + n * 0.2)}>
                    <span className="font-medium text-primary">Research: </span>
                    {r.text}{" "}
                    {r.href ? (
                      <a href={r.href} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{r.source} ↗</a>
                    ) : (
                      <span className="font-medium">{r.source}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <figure>
              {step.map !== false && <MiniMap active={step.places} />}
              <figcaption className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{step.view}</figcaption>
              <div className="demo-zoom rounded-lg border bg-background p-5 shadow-sm md:p-6" style={{ transformOrigin: zoomFrom }}>
                {step.screen}
              </div>
            </figure>
          </>
        ) : (
          <TryIt lang={lang} tryNeeds={tryNeeds} />
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="rounded-lg border-2 bg-background px-5 py-2.5 font-medium disabled:opacity-40">Back</button>
        <span className="hidden text-xs text-muted-foreground sm:inline">or use the arrow keys</span>
        {i < last && (
          <button onClick={() => go(i + 1)} className="ml-auto rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90">
            {i === last - 1 ? "Your turn" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

function PlatformLinks({ lang, className = "" }: { lang: string; className?: string }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      Open the full platform:{" "}
      {PLATFORM.map((p, n) => (
        <span key={p.as}>
          <Link href={`/${lang}/login?as=${p.as}`} className="font-medium text-primary hover:underline">{p.label}</Link>
          {n < PLATFORM.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}

/** Where we are in the big picture: the parts this step is about light up. */
function MiniMap({ active }: { active: Place[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5" aria-label={`You are looking at: ${active.map((p) => PLACES[p].label).join(", ")}`}>
      {(Object.keys(PLACES) as Place[]).map((p, n) => {
        const on = active.includes(p);
        const Icon = PLACES[p].icon;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {n > 0 && <span aria-hidden className="h-px w-3 bg-border" />}
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${on ? "demo-ring bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
              <Icon className="size-3.5" aria-hidden />
              {PLACES[p].label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** The big picture, City first: it organises the event, then the two sides join, with the EXAM room and AI in between. */
function BigPicture({ event }: { event: Story["event"] }) {
  const card = (p: Place, text: ReactNode, delay: number, extra = "") => {
    const Icon = PLACES[p].icon;
    return (
      <div className={`demo-pop rounded-lg border-2 bg-background p-4 ${extra}`} style={at(delay)}>
        <p className="flex items-center gap-2 font-heading text-lg text-primary">
          <Icon className="size-5" aria-hidden />
          {PLACES[p].label}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    );
  };
  const arrow = (label: string, delay: number, reverse = false) => (
    <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
      <span className="demo-rise text-[11px] leading-tight text-muted-foreground" style={at(delay + 0.3)}>{label}</span>
      <span className={`demo-grow block h-0.5 w-full bg-primary ${reverse ? "[transform-origin:right]" : ""}`} style={at(delay)} />
    </div>
  );
  return (
    <div className="space-y-2">
      {card(
        "city",
        <>
          Responsible for <strong className="text-foreground"><CountUp to={30000} /></strong> jobseekers. Organises {event ? `${event.title}, ${time(event.startsAt)}` : "the recruitment event"}, runs the EXAM rooms and stays in control.
        </>,
        0.1,
        "demo-ring border-primary",
      )}
      <div className="grid grid-cols-[1fr_56px_1.2fr_56px_1fr]">
        <span className="demo-grow-y mx-auto block h-6 w-0.5 bg-primary" style={at(0.6)} />
        <span />
        <span />
        <span />
        <span className="demo-grow-y mx-auto block h-6 w-0.5 bg-primary" style={at(0.6)} />
      </div>
      <div className="grid grid-cols-[1fr_56px_1.2fr_56px_1fr] items-stretch">
        {card("jobseeker", "Picks companies, takes one check, gets feedback.", 1.05)}
        {arrow("books 30 min", 1.7)}
        {card("exam", "Privacy guard in Finland, then an AI panel interview.", 1.4, "border-primary bg-tint/40")}
        {arrow("one real task", 1.9, true)}
        {card("company", event ? `${event.companies} companies joined. Each says what it needs.` : "Joins the event and says what it needs.", 0.85)}
      </div>
      <p className="demo-rise pt-2 text-center text-sm font-medium text-primary" style={at(2.4)}>Accepted checks become 15-minute meetings at the event</p>
    </div>
  );
}

/** Counts up to `to` once, for the opening number. */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = ms ? Math.min(1, (t - start) / ms) : 1;
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString("en-US")}</>;
}

function buildSteps(s: Story | null): Step[] {
  const missing = <p className="text-sm text-muted-foreground">The demo data is being prepared.</p>;
  return [
    {
      title: "The City of Espoo organises a recruitment event",
      text: "The City is responsible for about 30,000 jobseekers. It organises events where jobseekers and companies meet, and runs supervised EXAM rooms. CVs are now often written by AI, so the City needs better evidence of skills.",
      view: "The big picture: three portals",
      places: ["city"],
      map: false,
      refs: [
        { text: "Since the TE24 reform on 1 Jan 2025, the City of Espoo is the employment authority for about 30,000 jobseekers.", source: "Työmarkkinatori", href: "https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle" },
        { text: "Espoo TalentMatch events already bring 200 to 1,000 jobseekers and 5 to 50 employers together in 15-minute meetings.", source: "City of Espoo", href: "https://www.espoo.fi/en/talentmatch-events" },
      ],
      screen: <BigPicture event={s?.event ?? null} />,
    },
    {
      title: "Companies join and say what they need",
      text: "Each company joins the event and decides if it wants a skill check. If it does, it describes one real task and the skills it needs, or AI drafts it from its website. If not, City staff describe it with them.",
      view: "Company portal",
      places: ["company"],
      refs: [{ text: "Structured interviews about the job are the best single predictor of job performance.", source: "Sackett et al. 2022", href: "https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance" }],
      screen: s ? (
        <div>
          {s.event && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Joining {s.event.title}</p>
              <ul className="mt-2 space-y-1.5">
                {s.event.joining.map((c, n) => (
                  <li key={c.name} className="demo-rise flex items-center justify-between gap-3 rounded-md border px-3 py-1.5 text-sm" style={at(0.3 + n * 0.25)}>
                    <span>{c.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${c.mode === "required" ? "bg-primary text-primary-foreground" : "bg-tint text-primary"}`}>
                      {c.mode === "required" ? "skill check" : c.mode === "optional" ? "skill check optional" : "no check"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="demo-pop-ring mt-5 rounded-lg border-2 border-primary p-4" style={{ animationDelay: "1.5s, 2s" }}>
            <p className="text-sm font-medium text-primary">{s.need.company}</p>
            <p className="mt-0.5 font-heading text-xl">{s.need.title}</p>
            <p className="mt-2 line-clamp-3 text-sm">{s.need.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.need.skills.map((k, n) => (
                <span key={k} className="demo-pop rounded-full bg-tint px-3 py-1 text-xs capitalize text-primary" style={at(2.1 + n * 0.15)}>{k}</span>
              ))}
            </div>
          </div>
        </div>
      ) : missing,
    },
    {
      title: "Aino, a jobseeker, books an EXAM room",
      text: "Aino picks the companies she wants to meet at the event and books 30 minutes on a supervised City computer. In person, so the answers are her own.",
      view: "Jobseeker portal",
      places: ["jobseeker"],
      refs: [
        { text: "Finnish universities already run booked, supervised EXAM rooms in 29 institutions.", source: "Aalto University", href: "https://www.aalto.fi/en/services/electronic-examinations-exam-service" },
        { text: "One analysis of about 20,000 remote AI interviews flagged 38.5% for cheating. Google, McKinsey and Cisco brought back in-person rounds.", source: "Fabric, Entrepreneur", href: "https://www.entrepreneur.com/business-news/google-mckinsey-reintroduce-in-person-interviews-due-to-ai/496041" },
      ],
      screen: s ? (
        <div>
          <ol className="space-y-2">
            {[
              s.event ? `Opens ${s.event.title} in the jobseeker portal` : "Opens the event in the jobseeker portal",
              `Ticks the companies she wants to meet: ${s.need.company}`,
              "Books 30 minutes in a City EXAM room",
              "Goes there and talks about her skills",
            ].map((t, n) => (
              <li key={t} className="demo-rise flex items-center gap-3 text-sm" style={at(0.3 + n * 0.45)}>
                <span className="demo-pop flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" style={at(0.35 + n * 0.45)}>{n + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          {s.room && (
            <div className="demo-pop-ring mt-5 rounded-lg bg-tint p-4" style={{ animationDelay: "2.2s, 2.7s" }}>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Her EXAM room time</p>
              <p className="mt-1 font-heading text-xl">{time(s.room.startsAt)} to {time(s.room.endsAt, false)}</p>
              <p className="text-sm text-foreground/80">{s.room.venue}, {s.room.room}, {s.room.workstation}</p>
            </div>
          )}
        </div>
      ) : missing,
    },
    {
      title: "Aino takes the skill check",
      text: "An AI panel asks short questions about the real task, in Finnish, Swedish or English, by voice or text. Before any AI reads an answer, her name, employer, places and years are removed on our server in Finland.",
      view: "EXAM room computer",
      places: ["exam"],
      refs: [{ text: "Structured interviews about real tasks predict job performance better than CVs. Finland already trusts supervised EXAM rooms for exams.", source: "Sackett et al. 2022", href: "https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance" }],
      screen: s?.turns.length ? (
        <div className="space-y-4 text-sm">
          {s.turns.map((t, n) => (
            <div key={n} className="space-y-1.5">
              <p className="demo-rise font-medium" style={at(0.3 + n * 1.3)}>
                <span className="mr-2 text-xs font-semibold text-primary">Q{n + 1}</span>
                {short(t.question, 140)}
              </p>
              <p className="demo-rise ml-auto w-fit max-w-[90%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground" style={at(0.7 + n * 1.3)}>{short(t.said, 130)}</p>
              <p className={`demo-rise ml-auto w-fit max-w-[90%] rounded-lg px-3 py-2 text-foreground/80 ${n === 0 ? "border-2 border-primary/30 bg-surface" : "bg-surface"}`} style={at(1.0 + n * 1.3)}>
                <span className="mr-1 text-xs font-medium uppercase tracking-wide text-primary">AI saw</span>
                <Redacted text={short(t.seen, 130)} animateFrom={1.2 + n * 1.3} />
              </p>
            </div>
          ))}
        </div>
      ) : missing,
    },
    {
      title: "Why personal details are removed",
      text: "The AI only needs her reasoning. Her name, employer, school, places, years and anything about age, origin, gender, health or family are removed before any AI or company sees the answer.",
      view: "Privacy guard, on our server in Finland",
      places: ["exam"],
      refs: [
        { text: "Language models rank identical CVs differently by name.", source: "CUHK audit of 14 LLMs, 2026", href: "https://arxiv.org/pdf/2606.28978" },
        { text: "Anonymous recruitment raised hiring of applicants with foreign names in the City of Helsinki, when it was the default.", source: "VATT and LABORE 2023", href: "https://labore.fi/en/publications/anatomy-of-an-anonymous-hiring-pilot/" },
      ],
      screen: (
        <div>
          <div className="flex flex-wrap gap-2">
            {["name", "employer", "school", "place", "year", "origin", "contact", "personal"].map((k, n) => (
              <span key={k} className="demo-pop rounded bg-primary px-2 py-0.5 text-sm font-medium text-primary-foreground" style={at(0.2 + n * 0.12)}>{k} removed</span>
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {[
              { title: "GDPR", text: "Only what the job needs. Her real answers stay in our database in Finland. The AI models get the text with details removed.", link: "Data minimisation, GDPR Art. 5", href: "https://gdpr-info.eu/art-5-gdpr/" },
              { title: "Safety of personal data", text: "Names, employers and contact details never reach an AI model or a company. Every access is logged.", link: null, href: null },
              { title: "No bias", text: "Name, age, origin, gender or accent cannot change a score. Companies see an alias.", link: "Non-Discrimination Act 1325/2014", href: "https://www.finlex.fi/en/laki/kaannokset/2014/en20141325" },
            ].map((w, n) => (
              <li key={w.title} className="demo-rise rounded-lg border p-3" style={at(1.3 + n * 0.4)}>
                <p className="font-medium text-primary">{w.title}</p>
                <p className="mt-0.5 text-sm text-foreground/80">{w.text}</p>
                {w.href && (
                  <a href={w.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">{w.link} ↗</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "The result: feedback with evidence",
      text: "Aino gets feedback per skill, with her own words as proof and the reasoning. The company sees the same result under an alias, never her name. Unclear results go to City staff first.",
      view: "Jobseeker and company portals",
      places: ["jobseeker", "company"],
      refs: [
        { text: "A panel of AI judges from different model families agrees better with humans than one large judge.", source: "Verga et al. 2024", href: "https://arxiv.org/pdf/2404.18796" },
        { text: "In our own test, judges from three companies agreed 82%, with no penalty for answers in a second language.", source: "SkillCheck benchmark, decision D20" },
      ],
      screen: s?.evaluation ? (
        <div>
          <p className="demo-pop-ring inline-block rounded-md px-1 font-heading text-2xl" style={{ animationDelay: "0.4s, 0.9s" }}>{s.alias}</p>
          <div className="mt-4 flex flex-wrap gap-8">
            <Figure label="Match" value={`${s.evaluation.match}/10`} delay={0.6} />
            <Figure label="Level" value={s.evaluation.level} delay={0.75} />
            <Figure label="Confidence" value={`${Math.round(s.evaluation.confidence * 100)}%`} delay={0.9} />
          </div>
          <ul className="mt-5 space-y-4">
            {s.evaluation.skills.map((k, n) => (
              <li key={k.skill} className="demo-rise text-sm" style={at(1.1 + n * 0.25)}>
                <div className="flex justify-between">
                  <span className="capitalize">{k.skill}</span>
                  <span className="text-muted-foreground">{k.score}/10</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-tint">
                  <div className="demo-fill h-1.5 rounded-full bg-primary" style={{ width: `${k.score * 10}%`, ...at(1.3 + n * 0.25) }} />
                </div>
                {k.quote && <p className="mt-1 line-clamp-2 italic text-muted-foreground">“<Redacted text={k.quote} />”</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : missing,
    },
    {
      title: "People decide, the City keeps control",
      text: "The company invites her to a 15-minute meeting at the event. The AI never accepts or rejects anyone, and every access to personal data is logged for the City.",
      view: "Company and City portals",
      places: ["company", "city"],
      refs: [
        { text: "Recruitment AI is high-risk under the EU AI Act, so human oversight and logging are built in from the start.", source: "DLA Piper", href: "https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act" },
        { text: "AI cannot replace core skills assessment in public employment services.", source: "World Bank", href: "https://thedocs.worldbank.org/en/doc/98d7502c78085efeab2772e84e820572-0090012025/original/02-Use-of-data-and-AI-in-PES-May22.pdf" },
      ],
      screen: s ? (
        <div>
          <div className="demo-pop-ring rounded-lg bg-tint p-4" style={{ animationDelay: "0.4s, 0.9s" }}>
            <p className="font-medium text-primary">{s.decision?.accepted ? `Accepted by ${s.need.company}` : "Waiting for the company"}</p>
            {s.decision?.note && <p className="mt-1 text-sm">“{s.decision.note}”</p>}
            {s.meeting && <p className="mt-2 text-sm">15-minute meeting: {time(s.meeting.startsAt)}, {s.meeting.room}</p>}
          </div>
          <p className="demo-rise mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground" style={at(1)}>City audit log</p>
          <ul className="mt-2 divide-y border-y text-sm">
            {s.log.map((l, n) => (
              <li key={l.at + l.action} className="demo-rise flex justify-between gap-4 py-2" style={at(1.2 + n * 0.2)}>
                <span>{l.role} · <span className="font-mono text-xs">{l.action}</span></span>
                <span className="shrink-0 text-muted-foreground">{time(l.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : missing,
    },
  ];
}

function Figure({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <div className="demo-pop" style={at(delay)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl capitalize text-primary">{value}</p>
    </div>
  );
}

const LANGS = [
  { code: "en", label: "English" },
  { code: "fi", label: "Suomi" },
  { code: "sv", label: "Svenska" },
] as const;

/** The end: see the full working platform, or take a real skill check for a random job. */
function TryIt({ lang, tryNeeds }: { lang: string; tryNeeds: { id: string; title: string; company: string }[] }) {
  const [state, action, pending] = useActionState<DemoState, FormData>(startDemoCheck, {});
  return (
    <div className="md:col-span-2">
      <p className="demo-rise text-sm font-semibold text-primary">Your turn</p>
      <h2 className="demo-rise mt-2 text-3xl tracking-tight">What would you like to do?</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <form action={action} className="demo-pop flex flex-col rounded-xl border-2 border-primary bg-background p-6" style={at(0.2)}>
          <input type="hidden" name="lang" value={lang} />
          <p className="flex items-center gap-2 font-heading text-2xl text-primary">
            <MessagesSquare className="size-6" aria-hidden />
            Take a skill check
          </p>
          <p className="mt-2 text-foreground/80">
            We pick a job for you: {tryNeeds.map((n) => n.title.split(":")[0].toLowerCase()).join(", ")}. You get your own demo EXAM room computer for 30 minutes and the real AI panel. Please use made-up details.
          </p>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Language of the interview</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {LANGS.map((l) => (
                <label key={l.code} className="cursor-pointer rounded-lg border-2 px-3 py-2 text-center has-[:checked]:border-primary has-[:checked]:bg-tint/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
                  <input type="radio" name="language" value={l.code} defaultChecked={l.code === lang} className="sr-only" />
                  {l.label}
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={pending || !tryNeeds.length} className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-lg font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {pending ? "Preparing your EXAM room…" : "Start a random skill check"}
          </button>
          {pending && <p className="mt-2 text-sm text-muted-foreground">The panel is writing its first question. This takes about 20 seconds.</p>}
          {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
          <p className="mt-auto pt-4 text-xs text-muted-foreground">In the platform the City books the time and sets up the computer. Here it is done for you.</p>
        </form>

        <div className="demo-pop flex flex-col rounded-xl border-2 bg-background p-6" style={at(0.4)}>
          <p className="flex items-center gap-2 font-heading text-2xl text-primary">
            <Landmark className="size-6" aria-hidden />
            See the full platform
          </p>
          <p className="mt-2 text-foreground/80">Everything in this demo works in the real platform. Log in to any of the three portals. The demo accounts are filled in.</p>
          <div className="mt-6 grid gap-2">
            {PLATFORM.map((p) => {
              const Icon = p.as === "candidate" ? User : p.as === "company" ? Building2 : Landmark;
              return (
                <Link key={p.as} href={`/${lang}/login?as=${p.as}`} className="flex items-center justify-between rounded-lg border-2 border-primary px-4 py-3 font-medium text-primary hover:bg-tint">
                  <span className="flex items-center gap-2">
                    <Icon className="size-4" aria-hidden />
                    {p.as === "candidate" ? "Jobseeker: Aino" : p.as === "company" ? "Company: Kauklahti Parcel" : "City of Espoo"}
                  </span>
                  <span aria-hidden>→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
