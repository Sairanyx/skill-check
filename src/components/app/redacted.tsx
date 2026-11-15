// Pseudonymised text with every removed detail shown as a chip, so people see what the privacy guard took out.
const TAGS = /(\[(?:NAME|EMPLOYER|SCHOOL|PLACE|ORIGIN|CONTACT|YEAR|PERSONAL)\])/g;
const LABELS: Record<string, string> = {
  "[NAME]": "name",
  "[EMPLOYER]": "employer",
  "[SCHOOL]": "school",
  "[PLACE]": "place",
  "[ORIGIN]": "origin",
  "[CONTACT]": "contact",
  "[YEAR]": "year",
  "[PERSONAL]": "personal",
};

/** `animateFrom` (seconds): on /demo the chips pop in one by one from that moment, to draw the eye. */
export function Redacted({ text, animateFrom }: { text: string; animateFrom?: number }) {
  let n = 0;
  return (
    <>
      {text.split(TAGS).map((part, i) => {
        if (!LABELS[part]) return part;
        const at = animateFrom === undefined ? null : animateFrom + 0.35 * n++;
        return (
          <span
            key={i}
            title="Removed before any AI read the answer"
            className={`mx-0.5 inline-block rounded bg-primary px-1.5 text-[0.85em] font-medium leading-snug text-primary-foreground ${at === null ? "" : "demo-pop-ring"}`}
            style={at === null ? undefined : { animationDelay: `${at}s, ${at + 0.5}s` }}
          >
            {LABELS[part]} removed
          </span>
        );
      })}
    </>
  );
}
