"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiCall } from "./api-client";

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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">Save need</Button>
    </form>
  );
}
