// Pseudonymised transcript: what reviewers are allowed to read.
export function Transcript({ turns }: { turns: { question: string; seen: string }[] }) {
  return (
    <ol className="space-y-6">
      {turns.map((t, i) => (
        <li key={i} className="space-y-2 text-sm">
          <p className="font-medium">{t.question}</p>
          <p className="text-muted-foreground">{t.seen}</p>
        </li>
      ))}
    </ol>
  );
}
