"use client";

import { useEffect } from "react";
import { signOut } from "@/app/actions/auth";

/** Shared City computer: log out after 3 minutes without activity, and when the booked slot ends. */
export function KioskGuard({ lang, endsAt }: { lang: string; endsAt?: string }) {
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(idle);
      idle = setTimeout(() => signOut(lang), 3 * 60_000);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    const end = endsAt ? setTimeout(() => signOut(lang), Math.max(0, new Date(endsAt).getTime() - Date.now())) : undefined;
    return () => {
      clearTimeout(idle);
      if (end) clearTimeout(end);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [lang, endsAt]);
  return null;
}
