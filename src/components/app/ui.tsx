// Small shared building blocks for the portals. Plain and minimal on purpose.
export function PageTitle({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10">
      {kicker && <p className="text-sm font-medium text-primary">{kicker}</p>}
      <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t py-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

const STATUS: Record<string, string> = {
  in_progress: "In progress",
  evaluated: "Ready for companies",
  needs_review: "Waiting for City review",
  withdrawn: "Withdrawn",
};
export const statusLabel = (s: string) => STATUS[s] ?? s;

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Helsinki" });

/** Only the clock time in Finland, e.g. "17:00". */
export const fmtClock = (d: Date | string) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Helsinki" });
