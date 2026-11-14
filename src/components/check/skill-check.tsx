"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";

type Turn = { question: string; said: string; seen: string };
type Evaluation = {
  match: number;
  level: string;
  confidence: number;
  rubric: { criterion: string; score: number; evidence: string[] }[];
  strengths: string[];
  gaps: string[];
  fairness: { flags: string[]; note: string };
  model: string;
};

const MAX_SECONDS = 30;

export function SkillCheck({ needId, lang }: { needId: string; lang: Locale }) {
  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [step, setStep] = useState({ turn: 0, max: 6 });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  const history = (list: Turn[]) => list.map((t) => ({ question: t.question, answer: t.seen }));

  async function ask(list: Turn[]) {
    setBusy("thinking");
    const res = await fetch("/api/check/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needId, lang, turns: history(list) }),
    }).then((r) => r.json());
    if (res.done) {
      setQuestion(null);
      setBusy("evaluating");
      const ev = await fetch("/api/check/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needId, turns: history(list) }),
      }).then((r) => r.json());
      setEvaluation(ev);
    } else {
      setQuestion(res.question);
      setStep({ turn: res.turn, max: res.max });
    }
    setBusy(null);
  }

  // Runs on our server in Finland (Verda): (Whisper) → Gemma privacy guard.
  async function guard(form: FormData): Promise<{ text: string; clean: string }> {
    form.append("lang", lang);
    return fetch("/api/turn", { method: "POST", body: form }).then((r) => r.json());
  }

  async function send() {
    if (!question || !draft.trim()) return;
    setBusy("sending");
    const form = new FormData();
    form.append("text", draft);
    const { clean } = await guard(form);
    const next = [...turns, { question, said: draft.trim(), seen: clean }];
    setTurns(next);
    setDraft("");
    await ask(next);
  }

  async function toggleMic() {
    if (recording) return recorder.current?.stop();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setBusy("listening");
      const form = new FormData();
      form.append("audio", new Blob(chunks, { type: rec.mimeType }), "answer.webm");
      const { text } = await guard(form);
      setDraft((d) => (d ? `${d} ${text}` : text)); // candidate can read and fix before sending
      setBusy(null);
    };
    recorder.current = rec;
    rec.start();
    setRecording(true);
    setTimeout(() => rec.state === "recording" && rec.stop(), MAX_SECONDS * 1000);
  }

  if (evaluation) return <Result e={evaluation} />;

  if (!started)
    return (
      <div className="mt-10 max-w-2xl">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>About 6 short questions on how you would solve this company&apos;s problems.</li>
          <li>Answer by voice or text, in English, Finnish or Swedish.</li>
          <li>Everything is processed in Finland. Personal details are removed before AI reads your answers.</li>
          <li>AI gathers evidence. A person makes every decision.</li>
        </ul>
        <Button
          size="lg"
          className="mt-8 h-11 px-6 text-base"
          onClick={() => {
            setStarted(true);
            ask([]);
          }}
        >
          Start
        </Button>
      </div>
    );

  return (
    <div className="mt-8 max-w-3xl">
      <div className="h-1 w-full rounded-full bg-muted">
        <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${(step.turn / step.max) * 100}%` }} />
      </div>

      <div className="mt-8 space-y-6">
        {turns.map((t, i) => (
          <div key={i} className="space-y-3">
            <p className="font-medium">{t.question}</p>
            <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">{t.said}</div>
            <p className="ml-auto max-w-[85%] text-right text-xs text-muted-foreground">AI saw: {t.seen}</p>
          </div>
        ))}
        {question && <p className="font-medium">{question}</p>}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {busy === "evaluating" ? "Collecting evidence for a human reviewer…" : busy === "listening" ? "Listening…" : ""}
          </p>
        )}
      </div>

      {question && (
        <div className="mt-8 flex items-end gap-2 rounded-2xl border p-2 focus-within:border-primary">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={recording ? "Recording… press stop when done" : "Type or speak your answer"}
            rows={3}
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
          />
          <Button size="icon-lg" variant={recording ? "destructive" : "ghost"} onClick={toggleMic} aria-label="Speak" disabled={!!busy}>
            {recording ? <Square /> : <Mic />}
          </Button>
          <Button size="icon-lg" onClick={send} aria-label="Send" disabled={!draft.trim() || !!busy || recording}>
            <ArrowUp />
          </Button>
        </div>
      )}
    </div>
  );
}

function Result({ e }: { e: Evaluation }) {
  return (
    <div className="mt-10 max-w-3xl space-y-10">
      <div className="flex gap-12">
        <Stat label="Match" value={`${e.match}/10`} />
        <Stat label="Level" value={e.level} />
        <Stat label="Confidence" value={`${Math.round(e.confidence * 100)}%`} />
      </div>

      <section>
        <h2 className="font-semibold">Evidence</h2>
        <div className="mt-4 space-y-5">
          {e.rubric.map((r) => (
            <div key={r.criterion}>
              <div className="flex justify-between text-sm">
                <span className="capitalize">{r.criterion}</span>
                <span className="text-muted-foreground">{r.score}/10</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-muted">
                <div className="h-1 rounded-full bg-primary" style={{ width: `${r.score * 10}%` }} />
              </div>
              {r.evidence.map((q) => (
                <p key={q} className="mt-1 text-sm text-muted-foreground">“{q}”</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <List title="Strengths" items={e.strengths} />
        <List title="To show next time" items={e.gaps} />
      </section>

      <p className="border-t pt-6 text-xs text-muted-foreground">
        {e.fairness.flags.length
          ? `Fairness check flagged: ${e.fairness.flags.join(", ")}. A City of Espoo reviewer looks at this first.`
          : `Fairness check: ${e.fairness.note}`}{" "}
        Evaluated by {e.model} on pseudonymised answers. This is evidence for a human decision, not a decision.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold capitalize text-primary">{value}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
