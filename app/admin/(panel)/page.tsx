import Link from "next/link";
import { amountPaid, getCatalog, listClients, totalCollected } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { outstanding } from "@/lib/pricing";
import { computeProgress } from "@/lib/progress";
import { allProposals } from "@/lib/proposals";
import { proposalState } from "@/lib/proposal-def";
import { nowET } from "@/lib/booking";
import NewClient from "@/components/admin/NewClient";

export const dynamic = "force-dynamic";

const STATUS_TAG: Record<string, string> = { draft: "", sent: "gold", active: "green", completed: "green", archived: "" };

export default async function AdminHome() {
  const [clients, catalog, proposals] = await Promise.all([listClients(), getCatalog(), allProposals()]);
  const today = nowET().date;
  const live = clients.filter((c) => c.status !== "archived");
  const collected = clients.reduce((s, c) => s + totalCollected(c), 0);
  const owed = live.reduce((s, c) => s + outstanding(c.investment, amountPaid(c)), 0);
  const newReqs = clients.flatMap((c) => c.requests.filter((r) => r.status === "new").map((r) => ({ c, r })));
  const svcName = (id: string) => catalog.services.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Admin</p>
          <h2>Clients</h2>
        </div>
        <NewClient />
      </div>

      <div className="stat-tiles">
        <div className="panel"><span className="muted small">Active clients</span><span className="v">{live.filter((c) => c.status === "active").length}</span></div>
        <div className="panel"><span className="muted small">Collected</span><span className="v">{money(collected)}</span></div>
        <div className="panel"><span className="muted small">Outstanding</span><span className="v">{money(owed)}</span></div>
        <div className="panel"><span className="muted small">New requests</span><span className="v">{newReqs.length}</span></div>
      </div>

      {newReqs.length > 0 && (
        <div className="panel">
          <h3>New add-on requests</h3>
          {newReqs.map(({ c, r }) => (
            <div key={r.id} className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              <div className="stack" style={{ gap: 2 }}>
                <strong>{c.name}</strong>
                <span className="small">{r.addOnIds.map(svcName).join(", ") || "Note only"}</span>
                {r.note && <span className="small muted">“{r.note}”</span>}
              </div>
              <div className="row">
                <span className="small muted">{shortDate(r.date)}</span>
                <Link className="btn btn-sm btn-ghost" href={`/admin/clients/${c.id}#requests`}>Open</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Status</th>
              <th>Package</th>
              <th>Progress</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Last opened</th>
              <th><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan={9} className="muted">No clients yet. Create your first one above.</td></tr>
            )}
            {clients.map((c) => {
              const paid = amountPaid(c);
              const reqs = c.requests.filter((r) => r.status === "new").length;
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clients/${c.id}`} style={{ color: "var(--ink)", fontWeight: 600 }}>{c.name}</Link>
                    <div className="tiny muted">{c.contactName || c.email || `/p/${c.slug}`}</div>
                    <Link className="tiny" href={`/admin/clients/${c.id}/desk`}>Meeting view</Link>
                  </td>
                  <td>
                    <span className={`tag ${STATUS_TAG[c.status] ?? ""}`}>{c.status}</span>
                    {(() => { const ps = proposalState(proposals[c.id] ?? null, today); return ps ? <div style={{ marginTop: 6 }}><Link href={`/admin/clients/${c.id}/proposal`} className={`tag ${ps.tone}`} style={{ textDecoration: "none" }}>{ps.label}</Link></div> : null; })()}
                    {reqs > 0 && <div style={{ marginTop: 6 }}><span className="tag rust">{reqs} new request{reqs > 1 ? "s" : ""}</span></div>}
                  </td>
                  <td className="small">{c.package.title || <span className="muted">Not set</span>}</td>
                  <td className="small" style={{ minWidth: 110 }}>
                    {(() => {
                      const p = computeProgress(c);
                      return p ? (
                        <div className="stack" style={{ gap: 4 }}>
                          <span>{p.percent}%</span>
                          <div className="bar sm"><span style={{ width: `${p.percent}%` }} /></div>
                        </div>
                      ) : (
                        <span className="muted">None yet</span>
                      );
                    })()}
                  </td>
                  <td>{money(c.investment.total)}</td>
                  <td>{money(paid)}</td>
                  <td>{money(outstanding(c.investment, paid))}</td>
                  <td className="small muted">{c.lastViewedAt ? shortDate(c.lastViewedAt) : "Never"}</td>
                  <td><Link className="btn btn-sm btn-ghost" href={`/admin/clients/${c.id}`}>Edit</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
