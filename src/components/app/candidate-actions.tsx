"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiCall } from "./api-client";

export function BookSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); await apiCall(`/sessions/${sessionId}/book`, { method: "POST" }); router.refresh(); }}>
      Book
    </Button>
  );
}

/** Candidate is in the room: type the code City staff show there. */
export function CheckInForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex max-w-sm gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          await apiCall(`/sessions/${sessionId}/check-in`, { json: { code } });
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Room code" className="font-mono uppercase tracking-widest" maxLength={6} />
      <Button type="submit" disabled={code.length < 6}>Check in</Button>
      {error && <p className="self-center text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function StartCheckButton({ needId, sessionId, lang }: { needId: string; sessionId: string; lang: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await apiCall<{ checkId: string }>("/checks", { json: { needId, sessionId, language: lang } });
        router.push(`/${lang}/candidate/checks/${r.checkId}`);
      }}
    >
      {busy ? "Starting…" : "Start"}
    </Button>
  );
}
