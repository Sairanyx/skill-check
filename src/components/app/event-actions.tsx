"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

const MODES = [
  { value: "required", label: "Skill check required" },
  { value: "optional", label: "Skill check optional" },
  { value: "off", label: "No skill check needed" },
];

/** Company: apply to an event (choosing if a skill check is needed), then confirm after City approval. */
export function CompanyEventRow({ eventId, status, checkMode, canConfirm }: { eventId: string; status: string; checkMode: string | null; canConfirm: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState(checkMode ?? "required");
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={mode}
        disabled={status === "confirmed"}
        onChange={(e) => {
          setMode(e.target.value);
          if (status !== "not_applied") run(() => apiCall(`/events/${eventId}/apply`, { json: { checkMode: e.target.value } }));
        }}
        className="h-8 rounded-md border bg-background px-2 text-sm"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      {status === "not_applied" && <Button size="sm" onClick={() => run(() => apiCall(`/events/${eventId}/apply`, { json: { checkMode: mode } }))}>Apply</Button>}
      {status === "applied" && <span className="text-sm text-muted-foreground">Waiting for City approval</span>}
      {status === "approved" && (canConfirm ? <Button size="sm" onClick={() => run(() => apiCall(`/events/${eventId}/confirm`, { method: "POST" }))}>Confirm attendance</Button> : <span className="text-sm text-destructive">Confirmation deadline passed</span>)}
      {status === "confirmed" && <span className="text-sm text-primary">Attendance confirmed</span>}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

/** City: open event (no skill checks for anyone) or each company decides. */
export function EventPolicyToggle({ eventId, policy }: { eventId: string; policy: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={policy === "none"}
        onChange={async (e) => {
          await apiCall(`/events/${eventId}`, { method: "PATCH", json: { checkPolicy: e.target.checked ? "none" : "per_company" } });
          router.refresh();
        }}
      />
      No skill checks needed at this event
    </label>
  );
}

export function ApproveCompany({ eventId, appId }: { eventId: string; appId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={async () => { setBusy(true); await apiCall(`/events/${eventId}/applications/${appId}/approve`, { method: "POST" }); router.refresh(); }}>
      Approve
    </Button>
  );
}
