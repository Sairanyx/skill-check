"use client";

import { useActionState, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Building2, Landmark, MessagesSquare, User } from "lucide-react";
import { startDemoCheck, type DemoState } from "@/app/actions/demo";

/** Real platform pages, rendered on the server with a few rows from the demo database (see app/[lang]/demo/page.tsx). */
export type DemoScreens = { companies: ReactNode; book: ReactNode; check: ReactNode; result: ReactNode; decide: ReactNode };
type DemoEvent = { title: string; startsAt: string; companies: number } | null;
/** The four places in the big picture. Each zoomed-in step lights up the ones it is about. */
type Place = "city" | "company" | "jobseeker" | "exam";
type Ref = { text: string; source: string; href?: string };
/** `spot`: CSS selector of the key part inside the page, ringed after the page zooms in. */
type Step = { title: string; text: string; places: Place[]; refs: Ref[]; screen: ReactNode; spot?: string; map?: false };

const at = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
const time = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Helsinki", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const PLACES: Record<Place, { label: string; icon: typeof User; origin: string }> = {
  city: { label: "City of Espoo", icon: Landmark, origin: "50% 5%" },
  company: { label: "Company", icon: Building2, origin: "88% 30%" },
  jobseeker: { label: "Jobseeker", icon: User, origin: "12% 30%" },
  exam: { label: "EXAM room + AI", icon: MessagesSquare, origin: "50% 30%" },
};
const PLATFORM = [
  { as: "candidate", label: "Jobseeker" },
  { as: "company", label: "Company" },
  { as: "city", label: "City of Espoo" },
] as const;

/** The demo: the big picture, then a zoom into each real page, then a real skill check. */
export function DemoStory({ lang, event, screens, tryNeeds }: { lang: string; event: DemoEvent; screens: DemoScreens; tryNeeds: { id: string; title: string; company: string }[] }) {
  const steps = buildSteps(event, screens);
  const last = steps.length; // "Your turn" comes after the story
  const [i, setI] = useState(0);
  const go = useCallback((n: number) => setI(Math.max(0, Math.min(last, n))), [last]);
  const frame = useRef<HTMLElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [i, go]);

  // Lead the eye: once the page has zoomed in, ring the part this step is about.
  const step = steps[i];
  const spot = step?.spot;
  useEffect(() => {
    if (!spot) return;
    const t = setTimeout(() => {
      const el = frame.current?.querySelector(spot);
      if (!el) return;
      el.classList.add("demo-spot");
      // If the part is below the cut-off of the page, scroll the page inside its frame down to it.
      const page = el.closest("[data-page]") as HTMLElement | null;
      if (!page) return;
      const zoom = parseFloat(getComputedStyle(page).zoom) || 1;
      const offset = (el.getBoundingClientRect().top - page.getBoundingClientRect().top) / zoom;
      if (offset > page.clientHeight * 0.6) page.scrollTo({ top: offset - 40, behavior: "smooth" });
    }, 800);
    return () => clearTimeout(t);
  }, [i, spot]);

  const zoomFrom = step?.places.length === 1 ? PLACES[step.places[0]].origin : "50% 30%";
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.08em] text-primary">Demo</p>
          <h1 className="text-3xl tracking-tight">SkillCheck in two minutes</h1>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          SkillCheck is a working platform with portals for jobseekers, companies and the City of Espoo. This demo shows its real pages with synthetic data. <PlatformLinks lang={lang} />
        </p>
      </header>

      <nav aria-label="Demo steps" className="mt-6 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${last + 1}, minmax(0, 1fr))` }}>
        {[...steps.map((s) => s.title), "Your turn"].map((t, n) => (
          <button key={t} onClick={() => go(n)} aria-current={n === i ? "step" : undefined} aria-label={n < last ? `Step ${n + 1}: ${t}` : t} className="group text-left">
            <span className={`block h-1.5 rounded-full transition-colors duration-500 ${n <= i ? "bg-primary" : "bg-tint group-hover:bg-primary/40"}`} />
            <span className={`mt-1.5 hidden text-xs md:block ${n === i ? "font-semibold text-primary" : "text-muted-foreground"}`}>{n < last ? n + 1 : "Your turn"}</span>
          </button>
        ))}
      </nav>

      <section key={i} className="mt-5 grid gap-8 rounded-xl bg-surface p-5 md:grid-cols-[5fr_7fr] md:p-8">
        {step ? (
          <>
            <div className="demo-rise">
              <p className="text-sm font-semibold text-primary">{i + 1} / {last}</p>
              <h2 className="mt-1 text-2xl tracking-tight md:text-3xl">{step.title}</h2>
              <p className="mt-3 leading-relaxed text-foreground/85">{step.text}</p>
              <ul className="mt-5 space-y-2.5">
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
            <figure ref={frame}>
              {step.map !== false && <MiniMap active={step.places} />}
              <div className="demo-zoom" style={{ transformOrigin: zoomFrom }}>{step.screen}</div>
            </figure>
          </>
        ) : (
          <TryIt lang={lang} tryNeeds={tryNeeds} />
        )}
      </section>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="rounded-lg border-2 border-primary bg-background px-5 py-2 font-heading font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40">Back</button>
        <span className="hidden text-xs text-muted-foreground sm:inline">or use the arrow keys</span>
        {i < last && (
          <button onClick={() => go(i + 1)} className="ml-auto rounded-lg bg-primary px-6 py-2 font-heading font-bold text-primary-foreground transition-colors hover:bg-primary-hover">
            {i === last - 1 ? "Your turn" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

function PlatformLinks({ lang }: { lang: string }) {
  return (
    <span>
      Open it:{" "}
      {PLATFORM.map((p, n) => (
        <span key={p.as}>
          <Link href={`/${lang}/login?as=${p.as}`} className="font-medium text-primary hover:underline">{p.label}</Link>
          {n < PLATFORM.length - 1 ? " · " : ""}
        </span>
      ))}
    </span>
  );
}

/** Where we are in the big picture: the parts this step is about light up. */
function MiniMap({ active }: { active: Place[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5" aria-label={`You are looking at: ${active.map((p) => PLACES[p].label).join(", ")}`}>
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
function BigPicture({ event }: { event: DemoEvent }) {
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
    <div className="space-y-2 rounded-lg border bg-background p-5 shadow-md">
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

/** Why the privacy guard removes details: GDPR, safety, no bias. An explainer, not a platform page. */
function WhyRemoved() {
  return (
    <div className="rounded-lg border bg-background p-5 shadow-md">
      <div className="flex flex-wrap gap-2">
        {["name", "employer", "school", "place", "year", "origin", "contact", "personal"].map((k, n) => (
          <span key={k} className="demo-pop rounded bg-primary px-2 py-0.5 text-sm font-medium text-primary-foreground" style={at(0.2 + n * 0.12)}>{k} removed</span>
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
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
  );
}

function buildSteps(event: DemoEvent, screens: DemoScreens): Step[] {
  return [
    {
      title: "The City of Espoo organises a recruitment event",
      text: "The City is responsible for about 30,000 jobseekers. It organises events where jobseekers and companies meet, and runs supervised EXAM rooms. CVs are now often written by AI, so the City needs better evidence of skills.",
      places: ["city"],
      map: false,
      refs: [
        { text: "Since the TE24 reform on 1 Jan 2025, the City of Espoo is the employment authority for about 30,000 jobseekers.", source: "Työmarkkinatori", href: "https://tyomarkkinatori.fi/en/news/mita-kuuluu-espoon-ja-kauniaisten-tyollisyysalueelle" },
        { text: "Espoo TalentMatch events already bring 200 to 1,000 jobseekers and 5 to 50 employers together in 15-minute meetings.", source: "City of Espoo", href: "https://www.espoo.fi/en/talentmatch-events" },
      ],
      screen: <BigPicture event={event} />,
    },
    {
      title: "Companies join and say what they need",
      text: "Each company joins the event and decides if it wants a skill check. If it does, it describes one real task and the skills it needs, or AI drafts it from its website. If not, City staff describe it with them.",
      places: ["company", "city"],
      refs: [{ text: "Structured interviews about the job are the best single predictor of job performance.", source: "Sackett et al. 2022", href: "https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance" }],
      screen: screens.companies,
      spot: "ul",
    },
    {
      title: "Aino, a jobseeker, books an EXAM room",
      text: "Aino picks the companies she wants to meet, sees what each one asks for, and books 30 minutes on a supervised City computer. Up to three companies in one visit. No CV, no cover letter.",
      places: ["jobseeker"],
      refs: [
        { text: "Finnish universities already run booked, supervised EXAM rooms in 29 institutions.", source: "Aalto University", href: "https://www.aalto.fi/en/services/electronic-examinations-exam-service" },
        { text: "One analysis of about 20,000 remote AI interviews flagged 38.5% for cheating. Google, McKinsey and Cisco brought back in-person rounds.", source: "Fabric, Entrepreneur", href: "https://www.entrepreneur.com/business-news/google-mckinsey-reintroduce-in-person-interviews-due-to-ai/496041" },
      ],
      screen: screens.book,
      spot: "section:last-of-type",
    },
    {
      title: "Aino takes the skill check",
      text: "An AI panel asks short questions about the real task, in Finnish, Swedish or English, by voice or text. Before any AI reads an answer, her name, employer, places and years are removed on our server in Finland.",
      places: ["exam"],
      refs: [{ text: "Structured interviews about real tasks predict job performance better than CVs. Finland already trusts supervised EXAM rooms for exams.", source: "Sackett et al. 2022", href: "https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance" }],
      screen: screens.check,
      spot: ".border-dashed",
    },
    {
      title: "Why personal details are removed",
      text: "The AI only needs her reasoning. Her name, employer, school, places, years and anything about age, origin, gender, health or family are removed before any AI or company sees the answer.",
      places: ["exam"],
      refs: [
        { text: "Language models rank identical CVs differently by name.", source: "CUHK audit of 14 LLMs, 2026", href: "https://arxiv.org/pdf/2606.28978" },
        { text: "Anonymous recruitment raised hiring of applicants with foreign names in the City of Helsinki, when it was the default.", source: "VATT and LABORE 2023", href: "https://labore.fi/en/publications/anatomy-of-an-anonymous-hiring-pilot/" },
      ],
      screen: <WhyRemoved />,
    },
    {
      title: "The result: feedback with evidence",
      text: "Aino gets feedback per skill, with her own words as proof and the reasoning. The company sees the same result under an alias, never her name. Unclear results go to City staff first.",
      places: ["jobseeker", "company"],
      refs: [
        { text: "A panel of AI judges from different model families agrees better with humans than one large judge.", source: "Verga et al. 2024", href: "https://arxiv.org/pdf/2404.18796" },
        { text: "In our own test, judges from three companies agreed 82%, with no penalty for answers in a second language.", source: "SkillCheck benchmark, decision D20" },
      ],
      screen: screens.result,
      spot: ".gap-12",
    },
    {
      title: "People decide, the City keeps control",
      text: "The company invites her to a 15-minute meeting at the event. The AI never accepts or rejects anyone, and every decision and every access to personal data is logged for the City.",
      places: ["company", "city"],
      refs: [
        { text: "Recruitment AI is high-risk under the EU AI Act, so human oversight and logging are built in from the start.", source: "DLA Piper", href: "https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act" },
        { text: "AI cannot replace core skills assessment in public employment services.", source: "World Bank", href: "https://thedocs.worldbank.org/en/doc/98d7502c78085efeab2772e84e820572-0090012025/original/02-Use-of-data-and-AI-in-PES-May22.pdf" },
      ],
      screen: screens.decide,
      spot: "p.text-base",
    },
  ];
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
      <h2 className="demo-rise mt-1 text-2xl tracking-tight md:text-3xl">What would you like to do?</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
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
          <button disabled={pending || !tryNeeds.length} className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-heading text-lg font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60">
            {pending ? "Preparing your EXAM room…" : "Start a random skill check"}
          </button>
          {pending && <p className="mt-2 text-sm text-muted-foreground">The panel is writing its first question. This takes about 15 seconds.</p>}
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
                <Link key={p.as} href={`/${lang}/login?as=${p.as}`} className="flex items-center justify-between rounded-lg border-2 border-primary px-4 py-3 font-heading font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
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
