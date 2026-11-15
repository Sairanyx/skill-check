import { EventPolicyToggle, ApproveCompany } from "./event-actions";
import { eventMode, fmtTime } from "./ui";

type Event = { id: string; title: string; mode: string; startsAt: Date; checkPolicy: string };
type Application = { id: string; company: string; checkMode: string; approvedAt: Date | null; confirmedAt: Date | null };

/** One event and the companies that joined it, with their skill check setting. Used on the City page and in /demo. */
export function EventCompanies({ event, applications }: { event: Event; applications: Application[] }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <p className="font-medium">
          {event.title} <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal">{eventMode(event.mode)}</span>{" "}
          <span className="font-normal text-muted-foreground">· {fmtTime(event.startsAt)}</span>
        </p>
        <EventPolicyToggle eventId={event.id} policy={event.checkPolicy} />
      </div>
      <ul className="divide-y border-y text-sm">
        {applications.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 py-2">
            <span>
              {a.company} <span className="text-muted-foreground">· {a.checkMode === "off" ? "no skill check needed" : `skill check ${a.checkMode}`}</span>
            </span>
            {a.confirmedAt ? (
              <span className="text-primary">Confirmed</span>
            ) : a.approvedAt ? (
              <span className="text-muted-foreground">Approved, waiting for confirmation</span>
            ) : (
              <ApproveCompany eventId={event.id} appId={a.id} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
