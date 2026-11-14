import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireRole } from "@/lib/session";
import { sessionCode } from "@/lib/services/sessions";
import { RoomCode } from "@/components/app/city-actions";

/** Full-screen code for the display in the room. */
export default async function RoomScreen({ params }: PageProps<"/[lang]/city/sessions/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireRole(lang, "city");
  const s = await sessionCode(id).catch(() => null);
  if (!s) notFound();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 text-center">
      <p className="text-xl text-muted-foreground">{s.venue}, {s.room}</p>
      <RoomCode sessionId={id} />
      <p className="max-w-md text-muted-foreground">Log in to Skill Check and enter this code to start your skill checks.</p>
    </div>
  );
}
