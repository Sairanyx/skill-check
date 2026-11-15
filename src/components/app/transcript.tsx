import { Redacted } from "./redacted";

// Pseudonymised transcript: what reviewers are allowed to read.
export function Transcript({ turns }: { turns: { question: string; seen: string }[] }) {
  return (
    <ol className="space-y-6">
      {turns.map((t, i) => (
        <li key={i} className="space-y-2 text-sm">
          <p className="text-xs font-medium text-primary">Question {i + 1}</p>
          <p className="font-medium">{t.question}</p>
          <p className="text-xs font-medium text-muted-foreground">Answer, as the AI saw it</p>
          <p className="rounded-lg bg-surface px-4 py-3 leading-relaxed text-foreground/80">
            <Redacted text={t.seen} />
          </p>
        </li>
      ))}
    </ol>
  );
}
