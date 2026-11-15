"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiCall } from "./api-client";

type Lang = "fi" | "sv" | "en";
type LangReq = { language: Lang; level: string; proof?: "required" | "optional" };
type Anchors = { skill: string; anchors: { "1": string; "3": string; "5": string }; checklist: string[] }[];
type Bank = { junior?: string[]; mid?: string[]; senior?: string[] } | null;

const LANGS: [Lang, string][] = [["fi", "Finnish"], ["sv", "Swedish"], ["en", "English"]];
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const select = "h-9 rounded-md border bg-background px-2 text-sm";

/** Everything a company can tune on one need, saved with one button. Questions and anchors are screened for bias. */
export function NeedSettings(props: {
  needId: string;
  checkMode: string;
  languageRequirements: LangReq[];
  proofRequirements: { code: string; required: boolean }[];
  proofTypes: { code: string; label: string }[];
  questionBank: Bank;
  anchors: Anchors;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [anchors, setAnchors] = useState(props.anchors);
  const setAnchor = (i: number, key: "1" | "3" | "5", v: string) => setAnchors(anchors.map((a, j) => (j === i ? { ...a, anchors: { ...a.anchors, [key]: v } } : a)));
  const setChecklist = (i: number, v: string) => setAnchors(anchors.map((a, j) => (j === i ? { ...a, checklist: v.split("\n") } : a)));
  const lang = (l: Lang) => props.languageRequirements.find((r) => r.language === l);
  const proof = (code: string) => props.proofRequirements.find((r) => r.code === code);

  return (
    <form
      className="space-y-10"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const lines = (k: string) => String(f.get(k) ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
        setBusy(true);
        setMsg(null);
        try {
          await apiCall(`/needs/${props.needId}`, {
            method: "PATCH",
            json: {
              checkMode: f.get("checkMode"),
              languageRequirements: LANGS.filter(([c]) => f.get(`lang-${c}`)).map(([c]) => ({ language: c, level: f.get(`lang-${c}`), proof: f.get(`langproof-${c}`) ? "required" : "optional" })),
              proofRequirements: props.proofTypes.filter((p) => f.get(`proof-${p.code}`)).map((p) => ({ code: p.code, required: f.get(`proof-${p.code}`) === "required" })),
              questionBank: { junior: lines("q-junior"), mid: lines("q-mid"), senior: lines("q-senior") },
              anchors: anchors.map((a) => ({ ...a, checklist: a.checklist.map((x) => x.trim()).filter(Boolean) })),
            },
          });
          setMsg({ ok: true, text: "Saved." });
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="space-y-2">
        <h2 className="font-semibold">Skill check</h2>
        <select name="checkMode" defaultValue={props.checkMode} className={select}>
          <option value="required">Required before a meeting</option>
          <option value="optional">Optional</option>
          <option value="off">Not needed</option>
        </select>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Language the job really needs</h2>
        <p className="text-sm text-muted-foreground">Only if the work requires it. It gets its own score. Every other score ignores language.</p>
        {LANGS.map(([code, name]) => (
          <div key={code} className="flex flex-wrap items-center gap-4 text-sm">
            <span className="w-20">{name}</span>
            <select name={`lang-${code}`} defaultValue={lang(code)?.level ?? ""} className={select}>
              <option value="">Not required</option>
              {CEFR.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" name={`langproof-${code}`} defaultChecked={lang(code)?.proof === "required"} className="size-4 accent-primary" />
              Official certificate required
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Official proofs</h2>
        <p className="text-sm text-muted-foreground">No CV. Ask only for what the job or the law requires. City staff check the original.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {props.proofTypes.map((p) => (
            <label key={p.code} className="flex items-center justify-between gap-4 text-sm">
              {p.label}
              <select name={`proof-${p.code}`} defaultValue={proof(p.code) ? (proof(p.code)!.required ? "required" : "optional") : ""} className={select}>
                <option value="">Not needed</option>
                <option value="optional">Nice to have</option>
                <option value="required">Required</option>
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Your questions (optional)</h2>
        <p className="text-sm text-muted-foreground">One per line. The interviewer uses them as starting points. They are checked for questions about age, family, health or origin.</p>
        {(["junior", "mid", "senior"] as const).map((l) => (
          <div key={l} className="space-y-1">
            <p className="text-sm capitalize">{l}</p>
            <Textarea name={`q-${l}`} rows={3} defaultValue={(props.questionBank?.[l] ?? []).join("\n")} />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Scoring anchors</h2>
        <p className="text-sm text-muted-foreground">What a weak (1), solid (3) and excellent (5) answer looks like for each skill. The AI scores against these.</p>
        {anchors.map((a, i) => (
          <div key={a.skill} className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium capitalize">{a.skill}</p>
            {(["1", "3", "5"] as const).map((k) => (
              <div key={k} className="flex items-start gap-3 text-sm">
                <span className="w-4 pt-2 text-muted-foreground">{k}</span>
                <Textarea rows={2} value={a.anchors[k]} onChange={(e) => setAnchor(i, k, e.target.value)} />
              </div>
            ))}
            <div className="flex items-start gap-3 text-sm">
              <span className="w-4 pt-2 text-muted-foreground" aria-hidden>•</span>
              <Textarea rows={3} value={a.checklist.join("\n")} onChange={(e) => setChecklist(i, e.target.value)} placeholder="Checklist, one item per line" />
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Checking and saving…" : "Save"}</Button>
        {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}

export function AcceptSimilar({ needId, otherNeedId }: { needId: string; otherNeedId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await apiCall(`/needs/${needId}/equivalents`, { json: { otherNeedId } });
        router.refresh();
      }}
    >
      Accept
    </Button>
  );
}
