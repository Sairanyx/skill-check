"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiCall } from "./api-client";

/** City only: see who is behind a check. Needs a reason, which goes to the audit log. */
export function IdentityReveal({ checkId }: { checkId: string }) {
  const [reason, setReason] = useState("");
  const [who, setWho] = useState<{ name?: string; email?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (who) return <p className="text-sm">{who.name} · {who.email} <span className="text-muted-foreground">(this view was recorded)</span></p>;
  return (
    <form
      className="flex max-w-xl gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          setWho(await apiCall(`/checks/${checkId}/identity`, { json: { reason } }));
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, e.g. candidate asked for help" />
      <Button type="submit" variant="outline" disabled={!reason.trim()}>Show identity</Button>
      {error && <span className="self-center text-sm text-destructive">{error}</span>}
    </form>
  );
}
