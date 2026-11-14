"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiCall } from "./api-client";

const LANGS = [["fi", "Finnish"], ["sv", "Swedish"], ["en", "English"]] as const;
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function NeedForm({ lang }: { lang: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await apiCall("/needs", {
            json: {
              title: f.get("title"),
              summary: f.get("summary"),
              skills: String(f.get("skills")).split(","),
              level: f.get("level"),
              languageRequirements: LANGS.filter(([code]) => f.get(`lang-${code}`)).map(([code]) => ({ language: code, level: f.get(`lang-${code}`) })),
            },
          });
          router.push(`/${lang}/company`);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title">Role or problem</Label>
        <Input id="title" name="title" required placeholder="Cloud engineer: cost control" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">What is the real problem?</Label>
        <Textarea id="summary" name="summary" required rows={4} placeholder="Our cloud bill grew 40% in a year. We need someone who…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="skills">Key skills (comma separated)</Label>
        <Input id="skills" name="skills" required placeholder="Kubernetes, monitoring, cost optimisation" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <select id="level" name="level" defaultValue="mid" className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
        </select>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Language the job really needs (optional)</legend>
        <p className="text-sm text-muted-foreground">Only if the work itself requires it. It gets its own score. Every other score ignores language.</p>
        <div className="flex flex-wrap gap-6 pt-1">
          {LANGS.map(([code, name]) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              {name}
              <select name={`lang-${code}`} defaultValue="" className="h-9 rounded-md border bg-background px-2 text-sm">
                <option value="">Not required</option>
                {CEFR_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">Save need</Button>
    </form>
  );
}
