import { PagedRows } from "./paged";
import { fmtTime } from "./ui";

type Row = { at: Date; by: string; role: string; decision: string; aiFollowed: boolean | null; company: string; need: string };

/** Every human decision, newest first. Used on the City audit page and in /demo. */
export function DecisionLog({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-muted-foreground">
        <tr className="border-b">
          <th className="py-2 font-normal">Time</th>
          <th className="font-normal">Who</th>
          <th className="font-normal">Decision</th>
          <th className="font-normal">Matched AI</th>
          <th className="font-normal">Need</th>
        </tr>
      </thead>
      <tbody>
        <PagedRows columns={6}>
          {rows.map((d, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{fmtTime(d.at)}</td>
              <td>{d.by} ({d.role})</td>
              <td>{d.decision}</td>
              <td>{d.aiFollowed == null ? "n/a" : d.aiFollowed ? "yes" : "no"}</td>
              <td>{d.company} · {d.need}</td>
            </tr>
          ))}
        </PagedRows>
      </tbody>
    </table>
  );
}
