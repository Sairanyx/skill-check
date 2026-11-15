"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";
import { EvaluationView, type EvaluationData, type SkillAnchor } from "./evaluation-view";
import { Redacted } from "./redacted";

type Turn = { question: string; said?: string; seen: string };
type AnswerResult = { done: boolean; said: string; seen: string; question?: string; turn?: number; max?: number; evaluation?: EvaluationData };

const MAX_SECONDS = 30;
const MAX_TURNS = 6;

/**
 * The skill check conversation: voice or text, privacy guard on every answer, evaluation at the end.
 * `demo` (only on /demo) also shows what the AI received under each answer. Candidates do not see that in the platform.
 */
export function CheckRunner(props: { kiosk?: boolean; demo?: boolean; checkId: string; lang: string; initialTurns: Turn[]; pendingQuestion: string | null; evaluation: EvaluationData | null; anchors?: SkillAnchor[]; who?: string }) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>(props.initialTurns);
  const [question, setQuestion] = useState(props.pendingQuestion);
  const [evaluation, setEvaluation] = useState(props.evaluation);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<null | "sending" | "listening" | "evaluating">(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  async function send() {
    if (!question || !draft.trim()) return;
    setError(null);
    setBusy(turns.length + 1 >= MAX_TURNS ? "evaluating" : "sending");
    const form = new FormData();
    form.append("text", draft);
    try {
      const r = await apiCall<AnswerResult>(`/checks/${props.checkId}/answer`, { form });
      setTurns((t) => [...t, { question, said: r.said, seen: r.seen }]);
      setDraft("");
      if (r.done) {
        setQuestion(null);
        setEvaluation(r.evaluation ?? null);
        router.refresh();
      } else setQuestion(r.question ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
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
      form.append("lang", props.lang);
      try {
        const { text } = await apiCall<{ text: string }>("/transcribe", { form });
        setDraft((d) => (d ? `${d} ${text}` : text)); // read and fix before sending
      } catch (e) {
        setError((e as Error).message);
      }
      setBusy(null);
    };
    recorder.current = rec;
    rec.start();
    setRecording(true);
    setTimeout(() => rec.state === "recording" && rec.stop(), MAX_SECONDS * 1000);
  }

  return (
    <div className="max-w-3xl">
      {!evaluation && (
        <div className="h-1 w-full rounded-full bg-muted">
          <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${(turns.length / MAX_TURNS) * 100}%` }} />
        </div>
      )}

      <div className="mt-8 space-y-6">
        {turns.map((t, i) => (
          <div key={i} className="space-y-3">
            <div>
              <p className="text-xs font-medium text-primary">Question {i + 1}</p>
              <p className="mt-1 font-medium">{t.question}</p>
            </div>
            {t.said && (
              <div className="ml-auto max-w-[85%]">
                <p className="mb-1 text-right text-xs font-medium text-muted-foreground">{props.who ?? "Your"} answer</p>
                <div className="rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">{t.said}</div>
              </div>
            )}
            {props.demo && (
              <div className="ml-auto max-w-[85%] rounded-lg border-2 border-dashed border-primary/40 bg-surface px-4 py-3 text-sm">
                <p className="mb-1 text-xs font-medium text-primary">What the AI saw</p>
                <p className="leading-relaxed text-foreground/80">
                  <Redacted text={t.seen} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Shown for the demo. Candidates do not see this in the platform. The company and the City only ever see this version.</p>
              </div>
            )}
          </div>
        ))}
        {question && <p className="font-medium">{question}</p>}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {busy === "evaluating" ? "Collecting evidence for a human reviewer…" : busy === "listening" ? "Listening…" : ""}
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
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
          <Button size="icon-lg" variant={recording ? "destructive" : "ghost"} onClick={toggleMic} aria-label="Speak" disabled={!!busy && !recording}>
            {recording ? <Square /> : <Mic />}
          </Button>
          <Button size="icon-lg" onClick={send} aria-label="Send" disabled={!draft.trim() || !!busy || recording}>
            <ArrowUp />
          </Button>
        </div>
      )}

      {evaluation && (
        <div className="mt-12 border-t pt-10">
          <EvaluationView e={evaluation} audience="candidate" anchors={props.anchors} />
          {props.kiosk && (
            <Button size="lg" className="mt-10" onClick={() => router.push(`/${props.lang}/kiosk`)}>
              Next company or finish
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
