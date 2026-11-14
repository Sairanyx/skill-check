"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

export function SessionToggle({ sessionId, open }: { sessionId: string; open: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={open ? "outline" : "default"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await apiCall(`/sessions/${sessionId}`, { method: "PATCH", json: { action: open ? "close" : "open" } });
        router.refresh();
        setBusy(false);
      }}
    >
      {open ? "Close" : "Open room"}
    </Button>
  );
}

/** Big code for the screen in the room. Refreshes so a re-opened session shows the new code. */
export function RoomCode({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<{ accessCode: string | null; open: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => apiCall<{ accessCode: string | null; open: boolean }>(`/sessions/${sessionId}/code`).then((d) => alive && setData(d));
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [sessionId]);
  if (!data) return null;
  return data.open ? (
    <p className="font-mono text-8xl font-semibold tracking-[0.3em] text-primary md:text-9xl">{data.accessCode}</p>
  ) : (
    <p className="text-2xl text-muted-foreground">This session is closed.</p>
  );
}
