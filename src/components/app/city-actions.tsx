"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

/** City staff, sitting at a testing-room computer, make it that workstation (it becomes a locked kiosk). */
export function EnrollHere({ workstationId, label, lang }: { workstationId: string; label: string; lang: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        if (!confirm(`Make THIS computer "${label}"? Only people booked on it will be able to log in here.`)) return;
        setBusy(true);
        await apiCall(`/workstations/${workstationId}/enroll`, { method: "POST" });
        router.push(`/${lang}/kiosk`);
      }}
    >
      Use this computer
    </Button>
  );
}
