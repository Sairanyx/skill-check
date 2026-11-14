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

export function Redacted({ text }: { text: string }) {
  return (
    <>
      {text.split(TAGS).map((part, i) =>
        LABELS[part] ? (
          <span key={i} title="Removed before any AI read the answer" className="mx-0.5 inline-block rounded bg-primary px-1.5 text-[0.85em] font-medium leading-snug text-primary-foreground">
            {LABELS[part]} removed
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** How many details the guard removed from a text. */
export const removedCount = (text: string) => (text.match(TAGS) ?? []).length;
