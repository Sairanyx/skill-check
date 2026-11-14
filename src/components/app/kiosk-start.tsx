"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

export function KioskStart({ needId, lang, label }: { needId: string; lang: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-destructive">{error}</span>}
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await apiCall<{ checkId: string }>("/checks", { json: { needId, language: lang } });
            router.push(`/${lang}/candidate/checks/${r.checkId}`);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Starting…" : label}
      </Button>
    </div>
  );
}
