"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiCall } from "./api-client";

export function DeleteAccount({ lang }: { lang: string }) {
  const [sure, setSure] = useState(false);
  const router = useRouter();
  if (!sure) return <Button variant="outline" onClick={() => setSure(true)}>Delete my account</Button>;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span>This removes your name, email and answers. It cannot be undone.</span>
      <Button
        variant="destructive"
        onClick={async () => {
          await apiCall("/me", { method: "DELETE" });
          router.push(`/${lang}`);
          router.refresh();
        }}
      >
        Delete
      </Button>
    </div>
  );
}
