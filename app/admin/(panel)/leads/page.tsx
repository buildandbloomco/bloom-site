import { fmtTime } from "@/lib/booking";
import Link from "next/link";
import { listLeads } from "@/lib/leads";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const LANE: Record<string, string> = { orgs: "Helping organization", business: "Business", other: "Other" };
const STATUS_TAG: Record<string, string> = { new: "rust", contacted: "gold", converted: "green", closed: "" };

export default async function LeadsPage() {
  const leads = await listLeads();
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Leads</h2>
        <p className="muted small">Everyone who sends an inquiry, books a consult, or requests a guidebook.</p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Interested in</th><th>Status</th><th>Received</th><th><span className="sr-only">Open</span></th></tr>
          </thead>
          <tbody>
            {leads.length === 0 && <tr><td colSpan={6} className="muted">No inquiries yet. They will show up here when someone fills out your Contact page.</td></tr>}
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link href={`/admin/leads/${l.id}`} style={{ color: "var(--ink)", fontWeight: 600 }}>{l.name}</Link>
                  <div className="tiny muted">{[l.organization, l.role].filter(Boolean).join(" · ") || l.email}</div>
                </td>
                <td className="small">{LANE[l.lane]}</td>
                <td className="small">{l.interests.length ? `${l.interests.length} selected` : "Not specified"}{l.assessment ? " · snapshot" : ""}{l.guides?.map((g) => <div key={g.slug} className="tiny" style={{ marginTop: 4 }}><span className="tag gold">Guide{g.paid > 0 ? ` · paid $${g.paid}` : ""}</span> {g.title}</div>)}</td>
                <td><span className={`tag ${STATUS_TAG[l.status]}`}>{l.status}</span>{l.consult && <div className="tiny" style={{ marginTop: 4 }}>Consult {shortDate(l.consult.date).replace(/, \d{4}$/, "")}, {fmtTime(l.consult.start)}</div>}</td>
                <td className="small muted">{shortDate(l.createdAt)}</td>
                <td><Link className="btn btn-sm btn-ghost" href={`/admin/leads/${l.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
