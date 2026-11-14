"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiCall } from "./api-client";

/** A plain checkbox that records a consent through the API (and the audit log). */
export function ConsentToggle({ path, field, initial, label }: { path: string; field: string; initial: boolean; label: string }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 size-4 accent-primary"
        checked={on}
        onChange={async (e) => {
          const v = e.target.checked;
          setOn(v);
          await apiCall(path, { json: { [field]: v } });
          router.refresh();
        }}
      />
      <span>{label}</span>
    </label>
  );
}
