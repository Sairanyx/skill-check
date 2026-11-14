"use client";

import { Children, useState, type ReactNode } from "react";

/** Numbered pages under a long list: 1 2 3 … */
function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages < 2) return null;
  return (
    <nav className="mt-3 flex flex-wrap items-center gap-1 text-sm" aria-label="Pages">
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          onClick={() => onPage(i)}
          aria-current={i === page ? "page" : undefined}
          className={`min-w-8 rounded-md px-2 py-1 ${i === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );
}

/**
 * A long list, 10 at a time with numbered pages. Lists longer than one page start folded:
 * one click shows the first 10. Short lists are shown as they are.
 */
export function PagedList({ children, pageSize = 10, className = "divide-y border-y text-sm", noun = "items" }: { children: ReactNode; pageSize?: number; className?: string; noun?: string }) {
  const items = Children.toArray(children);
  const pages = Math.ceil(items.length / pageSize);
  const [open, setOpen] = useState(items.length <= pageSize);
  const [page, setPage] = useState(0);
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm hover:bg-muted">
        <span>
          Show {noun} <span className="text-muted-foreground">({items.length})</span>
        </span>
        <span aria-hidden>▾</span>
      </button>
    );
  return (
    <div>
      <ul className={className}>{items.slice(page * pageSize, (page + 1) * pageSize)}</ul>
      <div className="flex items-center justify-between">
        <Pager page={page} pages={pages} onPage={setPage} />
        {items.length > pageSize && (
          <button onClick={() => setOpen(false)} className="mt-3 text-sm text-muted-foreground hover:text-foreground">Fold ▴</button>
        )}
      </div>
    </div>
  );
}

/** Same for table rows: renders the rows of one page, with the pager in a last row. */
export function PagedRows({ children, pageSize = 10, columns }: { children: ReactNode; pageSize?: number; columns: number }) {
  const rows = Children.toArray(children);
  const pages = Math.ceil(rows.length / pageSize);
  const [page, setPage] = useState(0);
  return (
    <>
      {rows.slice(page * pageSize, (page + 1) * pageSize)}
      {pages > 1 && (
        <tr>
          <td colSpan={columns}>
            <Pager page={page} pages={pages} onPage={setPage} />
          </td>
        </tr>
      )}
    </>
  );
}
