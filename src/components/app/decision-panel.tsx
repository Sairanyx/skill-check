"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiCall } from "./api-client";

type Option = { value: string; label: string; primary?: boolean };

/** A person decides. The choice and note go to the append-only audit log. */
export function DecisionPanel({ checkId, options }: { checkId: string; options: Option[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the record (optional)" rows={2} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            variant={o.primary ? "default" : "outline"}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await apiCall(`/checks/${checkId}/decisions`, { json: { decision: o.value, note } });
                setNote("");
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
              setBusy(false);
            }}
          >
            {o.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Your decision is recorded with your name and time. The AI does not decide.</p>
    </div>
  );
}
