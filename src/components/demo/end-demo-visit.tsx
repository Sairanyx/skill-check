"use client";

import { useTransition } from "react";
import { endDemoVisit } from "@/app/actions/demo";

/** Leave the demo EXAM room: log out and turn this browser back into a normal one. */
export function EndDemoVisit({ lang }: { lang: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-16 border-t pt-6">
      <button onClick={() => start(() => endDemoVisit(lang))} disabled={pending} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
        {pending ? "Leaving…" : "Leave the demo EXAM room"}
      </button>
    </div>
  );
}
