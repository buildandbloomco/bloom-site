import "@/components/event/event.css";
import "@/components/tools/tools.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { listToolRecords } from "@/lib/tools";
import { TOOLS } from "@/lib/tools-def";
import ToolShell from "@/components/tools/ToolShell";

export const dynamic = "force-dynamic";

// What a client has filled in, for tools they have not marked private. View only.
export default async function AdminTools({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const recs = await listToolRecords(id);
  const used = TOOLS.filter((t) => recs[t.id]?.data);
  const shared = used.filter((t) => !recs[t.id].private);
  const privateCount = used.length - shared.length;
  const today = nowET().date;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href={`/admin/clients/${id}/desk`} className="small no-print">&larr; {client.name}</Link>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Books &amp; Tools</p>
        <h2 style={{ margin: 0 }}>{client.name}</h2>
        <p className="small muted" style={{ margin: 0 }}>{shared.length ? `${shared.length} ${shared.length === 1 ? "tool" : "tools"} shared with you.` : "Nothing shared yet."}{privateCount ? ` ${privateCount} more ${privateCount === 1 ? "is" : "are"} kept private.` : ""} Clients can mark any tool private.</p>
      </div>
      {shared.map((t) => (
        <details key={t.id} className="card">
          <summary style={{ cursor: "pointer" }}><strong>{t.name}</strong> <span className="small muted">· updated {new Date(recs[t.id].updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></summary>
          <div style={{ marginTop: 16 }}><ToolShell tool={t} mode="admin" initial={recs[t.id]} today={today} clientId={id} /></div>
        </details>
      ))}
    </div>
  );
}
