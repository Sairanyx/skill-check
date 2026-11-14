"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

type Slot = { id: string; startsAt: string | Date; room: string };

export function BookMeeting({ checkId, slots }: { checkId: string; slots: Slot[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const time = (d: string | Date) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Helsinki" });
  return (
    <div className="flex flex-wrap gap-2">
      {slots.slice(0, 12).map((s) => (
        <Button
          key={s.id}
          variant="outline"
          disabled={!!busy}
          onClick={async () => {
            setBusy(s.id);
            await apiCall("/bookings", { json: { checkId, slotId: s.id } });
            router.refresh();
          }}
        >
          {time(s.startsAt)} · {s.room}
        </Button>
      ))}
    </div>
  );
}
