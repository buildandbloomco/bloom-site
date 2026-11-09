import Link from "next/link";
import { ledger, SOURCE_LABEL, type Row, type Source } from "@/lib/ledger";
import { money, shortDate } from "@/lib/format";
import { nowET } from "@/lib/booking";

export const dynamic = "force-dynamic";

const SOURCES = Object.keys(SOURCE_LABEL) as Source[];
const RANGES = [["30", "Last 30 days"], ["month", "This month"], ["year", "This year"], ["all", "All time"]] as const;
type Range = (typeof RANGES)[number][0];

function since(range: Range, today: string): string {
  if (range === "month") return `${today.slice(0, 7)}-01`;
  if (range === "year") return `${today.slice(0, 4)}-01-01`;
  if (range === "30") {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }
  return "";
}

const sum = (rows: Row[]) => rows.reduce((s, r) => s + r.amount, 0);

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ source?: string; range?: string }> }) {
  const sp = await searchParams;
  const source = SOURCES.includes(sp.source as Source) ? (sp.source as Source) : "";
  const range: Range = RANGES.some(([k]) => k === sp.range) ? (sp.range as Range) : "30";
  const today = nowET().date;
  const from = since(range, today);

  const all = await ledger();
  const pending = all.filter((r) => r.status === "pending");
  const paid = all.filter((r) => r.status === "paid");
  const inRange = paid.filter((r) => !from || r.date.slice(0, 10) >= from);
  const shown = inRange.filter((r) => !source || r.source === source);
  const monthStart = `${today.slice(0, 7)}-01`;

  const q = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(source ? { source } : {}), range, ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin/payments?${p.toString()}`;
  };

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Admin</p>
          <h2>Payments</h2>
          <p className="small muted" style={{ margin: 0 }}>Every payment on your site in one place: event seats, client packages, courses, shop orders, and guidebooks.</p>
        </div>
        {paid.length > 0 && <a className="btn btn-sm btn-ghost" href={`/api/admin/payments/csv${from ? `?from=${from}` : ""}`}>Download spreadsheet</a>}
      </div>

      <div className="stat-tiles">
        <div className="panel"><span className="muted small">This month</span><span className="v">{money(sum(paid.filter((r) => r.date.slice(0, 10) >= monthStart)))}</span></div>
        <div className="panel"><span className="muted small">{RANGES.find(([k]) => k === range)![1]}</span><span className="v">{money(sum(inRange))}</span></div>
        <div className="panel"><span className="muted small">Payments in this view</span><span className="v">{shown.length}</span></div>
        <div className="panel"><span className="muted small">Zelle to confirm</span><span className="v">{pending.length ? money(sum(pending)) : "None"}</span></div>
      </div>

      {pending.length > 0 && (
        <section className="panel stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Waiting on you: Zelle to confirm ({pending.length})</h3>
          <p className="small muted" style={{ margin: 0 }}>These people said they sent Zelle. Check your bank, then confirm each one so it counts as paid.</p>
          {pending.map((r) => (
            <div key={r.id} className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div className="stack" style={{ gap: 2 }}>
                <strong>{r.who} · {money(r.amount)}</strong>
                <span className="small">{r.what}</span>
                <span className="tiny muted">{SOURCE_LABEL[r.source]} · told you on {shortDate(r.date)}</span>
              </div>
              <Link className="btn btn-sm" href={r.confirmHref || r.href}>Confirm</Link>
            </div>
          ))}
        </section>
      )}

      <section className="stack" style={{ gap: 12 }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {RANGES.map(([k, label]) => (
            <Link key={k} href={q({ range: k })} className={`chip ${range === k ? "on" : ""}`}>{label}</Link>
          ))}
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link href={q({ source: "" })} className={`chip ${!source ? "on" : ""}`}>Everything · {money(sum(inRange))}</Link>
          {SOURCES.map((s) => {
            const n = inRange.filter((r) => r.source === s);
            return n.length ? <Link key={s} href={q({ source: s })} className={`chip ${source === s ? "on" : ""}`}>{SOURCE_LABEL[s]} · {money(sum(n))}</Link> : null;
          })}
        </div>
      </section>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Who</th><th>For</th><th>Type</th><th>Method</th><th style={{ textAlign: "right" }}>Amount</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={6} className="muted">No payments {from ? "in this time frame" : "yet"}{source ? ` for ${SOURCE_LABEL[source].toLowerCase()}` : ""}. {range !== "all" && <Link href={q({ range: "all" })}>See all time</Link>}</td></tr>
            )}
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="small" style={{ whiteSpace: "nowrap" }}>{shortDate(r.date)}</td>
                <td><Link href={r.href} style={{ color: "var(--ink)", fontWeight: 600 }}>{r.who}</Link>{r.email && <div className="tiny muted">{r.email}</div>}</td>
                <td className="small">{r.what}</td>
                <td><span className={`tag ${r.source === "event" ? "gold" : r.source === "client" ? "green" : ""}`}>{SOURCE_LABEL[r.source]}</span></td>
                <td className="small">{r.method}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{money(r.amount)}</td>
              </tr>
            ))}
            {shown.length > 1 && (
              <tr><td colSpan={5} style={{ textAlign: "right" }} className="small muted">Total</td><td style={{ textAlign: "right", fontWeight: 700 }}>{money(sum(shown))}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>Card payments show up here once Stripe confirms them. Refunds made in Stripe are not subtracted here, so check your Stripe dashboard for those.</p>
    </div>
  );
}
