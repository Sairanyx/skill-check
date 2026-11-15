import type { ReactNode } from "react";

/**
 * A real platform page, shown small inside /demo: the address it lives at, who is looking, and the page itself.
 * Read only (inert), zoomed out, cut off at the bottom so only the basics show.
 */
export function BrowserFrame({ url, who, children, height = 600 }: { url: string; who: string; children: ReactNode; height?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-md">
      <div className="flex items-center gap-3 border-b bg-surface px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">{url}</span>
        <span className="shrink-0 rounded-full bg-tint px-2 py-0.5 text-xs font-medium text-primary">{who}</span>
      </div>
      <div inert data-page className="overflow-hidden px-7 py-6 [mask-image:linear-gradient(to_bottom,black_82%,transparent)]" style={{ zoom: 0.72, maxHeight: height }}>
        {children}
      </div>
    </div>
  );
}
