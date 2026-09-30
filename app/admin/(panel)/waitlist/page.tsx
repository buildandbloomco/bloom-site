import { listWaitlist } from "@/lib/waitlist";
import { TEAM_SIZES, WELLNESS_INTERESTS } from "@/lib/wellness";
import WaitlistTable from "@/components/admin/WaitlistTable";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  const rows = await listWaitlist();
  const teams = rows.filter((r) => r.plan === "team");
  const counts = WELLNESS_INTERESTS.map(([k, l]) => ({ k, l, n: rows.filter((r) => r.interests.includes(k)).length })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Admin</p>
          <h2>Wellness Library waitlist</h2>
          <p className="muted small">Everyone who joined from your <a href="/wellness-library" target="_blank" rel="noopener noreferrer">Wellness Library page ↗</a>. Use it to decide which plan to launch first.</p>
        </div>
        {rows.length > 0 && <a className="btn btn-sm btn-ghost" href="/api/admin/waitlist/csv">Download spreadsheet</a>}
      </div>

      <div className="stat-tiles">
        <div className="panel"><span className="small muted">Total</span><strong style={{ fontSize: "2rem" }}>{rows.length}</strong></div>
        <div className="panel"><span className="small muted">Individuals</span><strong style={{ fontSize: "2rem" }}>{rows.length - teams.length}</strong></div>
        <div className="panel"><span className="small muted">Teams</span><strong style={{ fontSize: "2rem" }}>{teams.length}</strong></div>
        <div className="panel"><span className="small muted">Largest team size</span><strong style={{ fontSize: "1.3rem" }}>{TEAM_SIZES.filter((z) => teams.some((t) => t.teamSize === z)).pop() || "None yet"}</strong></div>
      </div>

      {rows.length > 0 && (
        <section className="panel" style={{ maxWidth: 760 }}>
          <h3>What people want most</h3>
          {counts.map((c) => (
            <div key={c.k} className="stack" style={{ gap: 4 }}>
              <div className="row between small"><span>{c.l}</span><strong>{c.n}</strong></div>
              <div className="bar sm"><span style={{ width: `${(c.n / max) * 100}%` }} /></div>
            </div>
          ))}
        </section>
      )}

      <WaitlistTable rows={rows} />
    </div>
  );
}
