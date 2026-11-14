"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";
import { formProblem } from "./form-check";

type ProofType = { code: string; kind: string; label: { en: string } };
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Jobseeker: say which official proof you have. City staff check the original at your visit. */
export function AddProof({ types }: { types: ProofType[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isLanguage = types.find((t) => t.code === code)?.kind === "language";
  return (
    <form noValidate
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const problem = formProblem(e.currentTarget);
        if (problem) return setError(problem);
        const f = new FormData(e.currentTarget);
        try {
          await apiCall("/me/proofs", { json: { code, level: f.get("level") || undefined } });
          setCode("");
          setError(null);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <select aria-label="Proof" value={code} onChange={(e) => setCode(e.target.value)} required className="h-9 rounded-md border bg-background px-2 text-sm">
        <option value="">Choose a proof</option>
        {types.map((t) => (
          <option key={t.code} value={t.code}>{t.label.en}</option>
        ))}
      </select>
      {isLanguage && (
        <select aria-label="Level" name="level" required defaultValue="" className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="" disabled>Level</option>
          {CEFR.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      )}
      <Button type="submit">Add</Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function RemoveProof({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="text-sm text-muted-foreground hover:text-destructive"
      onClick={async () => {
        await apiCall(`/me/proofs/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Remove
    </button>
  );
}

/** City staff at the EXAM room desk: record what you checked. No copy of the document is kept. */
export function VerifyProof({ id, howToCheck }: { id: string; howToCheck: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const send = async (verified: boolean) => {
    setBusy(true);
    await apiCall(`/city/proofs/${id}/verify`, { json: { verified, method: howToCheck } });
    router.refresh();
  };
  return (
    <span className="flex gap-3">
      <Button size="sm" disabled={busy} onClick={() => send(true)}>Verified</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => send(false)}>Not valid</Button>
    </span>
  );
}
