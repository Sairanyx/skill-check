// Pseudonymised transcript: what reviewers are allowed to read.
export function Transcript({ turns }: { turns: { question: string; seen: string }[] }) {
  return (
    <ol className="space-y-6">
      {turns.map((t, i) => (
        <li key={i} className="space-y-2 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Question {i + 1}</p>
          <p className="font-medium">{t.question}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Answer, as the AI saw it (personal details removed)</p>
          <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">{t.seen}</p>
        </li>
      ))}
    </ol>
  );
}
