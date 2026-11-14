// Shown while a page loads its data (also gives every page the <Suspense> boundary Next.js 16 needs).
export default function Loading() {
  return <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted-foreground">Loading…</div>;
}
