"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  bucketBalances, CHECKLIST, estimatedTaxDates, money0, monthLabel, monthOf, parseBankCsv, r2, shiftMonth, totals, unallocated,
  type FinSettings, type Owed, type Tx,
} from "@/lib/finance-def";
import { Guide, PrivacyBar, AdminLocked, AdminSummary, Team, type Summary } from "./MoneyExtras";

const TABS = [
  ["overview", "Overview"], ["split", "Split income"], ["tx", "Transactions"], ["budget", "Budget"],
  ["owed", "Invoices & bills"], ["team", "Team"], ["taxes", "Taxes"], ["close", "Month-end"], ["reports", "Reports"], ["setup", "Set up"], ["guide", "How to use Money"],
] as const;
export type Tab = (typeof TABS)[number][0];
const IN_COLOR = "#2176A8", OUT_COLOR = "#C9682E";
const day = (d: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const NO_MONTH: Tab[] = ["setup", "taxes", "owed", "guide", "team"];

/**
 * A client's money plan. In their portal the client owns it completely.
 * From admin you only see what they choose to share, and only to read.
 */
export default function MoneyBoard({ as, clientId, today, clientName }: { as: "client" | "us"; clientId: string; today: string; clientName: string }) {
  const [s, setS] = useState<FinSettings | null>(null);
  const [tx, setTx] = useState<Tx[]>([]);
  const [view, setView] = useState<"own" | "private" | "summary" | "full">("own");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const qs = as === "us" ? `?c=${clientId}` : "";
  const take = (j: { view?: typeof view; settings: FinSettings; tx: Tx[]; summary?: Summary }) => { setS(j.settings); setTx(j.tx ?? []); setView(j.view ?? "own"); setSummary(j.summary ?? null); };

  useEffect(() => {
    fetch(`/api/fin${qs}`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || "Could not load."); return; }
      take(j);
      // First visit with nothing entered yet: start with the guide
      if (as === "client" && !(j.tx ?? []).length) setTab("guide");
    });
  }, [qs, as]);

  async function api(op: string, payload: Record<string, unknown> = {}, ok = "") {
    setBusy(true); setMsg("");
    const res = await fetch("/api/fin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, ...payload, ...(as === "us" ? { c: clientId } : {}) }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong."); return null; }
    take(j); if (ok) setMsg(ok);
    return j;
  }
  const saveSettings = (patch: Partial<FinSettings>, ok = "Saved") => api("settings", { patch }, ok);

  if (!s) return <p className="muted">{msg || "Loading your numbers..."}</p>;
  const monthTx = tx.filter((t) => monthOf(t.date) === month);
  const readOnly = as === "us";
  const teamShared = as === "client" || !!s.share?.includeTeam;
  const tabs = TABS.filter(([id]) => (id === "team" ? teamShared : true) && !(readOnly && (id === "setup" || id === "guide")));

  const adminBar = as === "us" && (
    <section className="panel row between" style={{ gap: 12, flexWrap: "wrap" }}>
      <label className="row" style={{ gap: 8 }}>
        <input type="checkbox" style={{ width: "auto" }} checked={s.enabled} onChange={(e) => saveSettings({ enabled: e.target.checked } as Partial<FinSettings>, e.target.checked ? "On. Money now shows in their portal." : "Hidden from their portal.")} />
        <span><strong>Show Money in {clientName}&rsquo;s portal</strong></span>
      </label>
      <span className="small muted">{view === "private" ? "They keep it private." : view === "summary" ? "They are sharing a summary." : view === "full" ? `They are sharing everything${s.share.includeTeam ? ", including team pay" : ""}, to view only.` : ""}{s.share?.until && view !== "private" ? ` Until ${day(s.share.until)}.` : ""}</span>
    </section>
  );
  if (as === "us" && view === "private") return <div className="stack" style={{ gap: 18 }}>{adminBar}<AdminLocked s={s} clientName={clientName} api={api} msg={msg} /></div>;
  if (as === "us" && view === "summary" && summary) return <div className="stack" style={{ gap: 18 }}>{adminBar}<AdminSummary s={s} summary={summary} clientName={clientName} today={today} /></div>;

  return (
    <div className="stack fin" style={{ gap: 18 }}>
      {adminBar}
      {as === "client" && <PrivacyBar s={s} api={api} today={today} />}
      <div className="fin-tabs" role="tablist" aria-label="Money sections">
        {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {!NO_MONTH.includes(tab) && (
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn-sm btn-ghost" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>&larr;</button>
          <strong style={{ minWidth: 170, textAlign: "center" }}>{monthLabel(month)}</strong>
          <button type="button" className="btn btn-sm btn-ghost" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>&rarr;</button>
          {month !== today.slice(0, 7) && <button type="button" className="linkbtn small" onClick={() => setMonth(today.slice(0, 7))}>This month</button>}
          <span className="small" role="status" style={{ marginLeft: "auto" }}>{busy ? "Saving..." : msg}</span>
        </div>
      )}
      {NO_MONTH.includes(tab) && msg && <span className="small" role="status">{msg}</span>}
      {readOnly && <p className="small muted" style={{ margin: 0 }}>View only. {clientName} controls what is shared and makes all changes.</p>}

      <fieldset disabled={readOnly} className="fin-body">
        {tab === "overview" && <Overview s={s} tx={tx} monthTx={monthTx} month={month} today={today} go={setTab} />}
        {tab === "split" && <SplitBoard s={s} monthTx={monthTx} tx={tx} month={month} api={api} />}
        {tab === "tx" && <Transactions s={s} monthTx={monthTx} month={month} api={api} as={as} clientId={clientId} />}
        {tab === "budget" && <Budget s={s} monthTx={monthTx} save={saveSettings} />}
        {tab === "owed" && <OwedList s={s} today={today} save={saveSettings} api={api} />}
        {tab === "team" && <Team s={s} tx={tx} today={today} save={saveSettings} api={api} />}
        {tab === "taxes" && <Taxes s={s} tx={tx} today={today} save={saveSettings} />}
        {tab === "close" && <MonthEnd s={s} month={month} monthTx={monthTx} save={saveSettings} />}
        {tab === "setup" && <Setup s={s} save={saveSettings} />}
        {tab === "guide" && <Guide go={setTab} />}
      </fieldset>
      {/* Reports stay usable when viewing, so you can download what they shared */}
      {tab === "reports" && <Reports s={s} tx={tx} month={month} clientName={clientName} />}

      <p className="tiny muted" style={{ margin: 0 }}>Money is a planning and record-keeping tool. It is not accounting, tax, payroll, or legal advice. Your bank statements are the official record, and a tax professional should confirm what you owe.</p>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ s, tx, monthTx, month, today, go }: { s: FinSettings; tx: Tx[]; monthTx: Tx[]; month: string; today: string; go: (t: Tab) => void }) {
  const t = totals(monthTx);
  const bal = bucketBalances(s, tx);
  const unsplit = r2(monthTx.reduce((a, x) => a + unallocated(x), 0));
  const uncategorized = monthTx.filter((x) => !x.category).length;
  const noReceipt = monthTx.filter((x) => x.type === "out" && !x.receiptUrl).length;
  const overdue = s.owed.filter((o) => o.status === "open" && o.due && o.due < today);
  const nextTax = estimatedTaxDates(Number(today.slice(0, 4))).concat(estimatedTaxDates(Number(today.slice(0, 4)) + 1)).find((q) => q.due >= today);
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
  const series = months.map((m) => ({ m, ...totals(tx.filter((x) => monthOf(x.date) === m)) }));
  const items = [
    unsplit > 0 && { text: `${money0(unsplit)} of income is not split into buckets yet`, tab: "split" as Tab },
    uncategorized > 0 && { text: `${uncategorized} ${uncategorized === 1 ? "transaction needs" : "transactions need"} a category`, tab: "tx" as Tab },
    noReceipt > 0 && { text: `${noReceipt} ${noReceipt === 1 ? "expense has" : "expenses have"} no receipt attached`, tab: "tx" as Tab },
    overdue.length > 0 && { text: `${overdue.length} ${overdue.length === 1 ? "invoice or bill is" : "invoices or bills are"} past due`, tab: "owed" as Tab },
    nextTax && { text: `Next estimated tax payment: ${nextTax.label}, due ${day(nextTax.due)}`, tab: "taxes" as Tab },
  ].filter(Boolean) as { text: string; tab: Tab }[];
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="fin-tiles">
        <div><span className="k">Money in</span><span className="v">{money0(t.inn)}</span></div>
        <div><span className="k">Money out</span><span className="v">{money0(t.out)}</span></div>
        <div><span className="k">Net for the month</span><span className="v" style={{ color: t.net < 0 ? "#9b2317" : undefined }}>{money0(t.net)}</span></div>
        <div><span className="k">Set aside for taxes</span><span className="v">{money0(bal.tax?.balance ?? 0)}</span></div>
      </div>
      <div className="grid-2" style={{ gap: 18, alignItems: "start" }}>
        <section className="card stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Your buckets</h3>
          {s.buckets.map((b) => (
            <div key={b.id} className="row between small" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
              <span><strong>{b.name}</strong> <span className="muted">{b.pct}%</span></span>
              <strong>{money0(bal[b.id]?.balance ?? 0)}</strong>
            </div>
          ))}
        </section>
        <section className="card stack" style={{ gap: 8 }}>
          <h3 style={{ margin: 0 }}>Needs a look</h3>
          {items.length === 0 && <p className="small muted" style={{ margin: 0 }}>All caught up for {monthLabel(month)}.</p>}
          {items.map((i) => <button key={i.text} type="button" className="fin-todo" onClick={() => go(i.tab)}>{i.text} <span aria-hidden="true">&rarr;</span></button>)}
        </section>
      </div>
      <InOutChart series={series} />
    </div>
  );
}

/** Six months of money in and money out, side by side */
function InOutChart({ series }: { series: { m: string; inn: number; out: number; net: number }[] }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.flatMap((x) => [x.inn, x.out]));
  const W = 640, H = 220, padL = 8, padB = 28, slot = (W - padL) / series.length, bw = Math.min(26, slot / 3.2);
  const y = (v: number) => (H - padB) * (1 - v / max);
  const short = (m: string) => new Date(m + "-15T12:00:00").toLocaleDateString("en-US", { month: "short" });
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>Money in and out, last six months</h3>
        <div className="row small" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 6 }}><span className="fin-key" style={{ background: IN_COLOR }} />Money in</span>
          <span className="row" style={{ gap: 6 }}><span className="fin-key" style={{ background: OUT_COLOR }} />Money out</span>
          <button type="button" className="linkbtn small" onClick={() => setTable(!table)}>{table ? "Show chart" : "Show as table"}</button>
        </div>
      </div>
      {table ? (
        <table className="fin-table"><thead><tr><th>Month</th><th>In</th><th>Out</th><th>Net</th></tr></thead>
          <tbody>{series.map((x) => <tr key={x.m}><td>{monthLabel(x.m)}</td><td>{money0(x.inn)}</td><td>{money0(x.out)}</td><td>{money0(x.net)}</td></tr>)}</tbody></table>
      ) : (
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Money in and money out by month">
            {[0.5, 1].map((f) => <line key={f} x1={padL} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" strokeWidth="1" />)}
            <line x1={padL} x2={W} y1={H - padB} y2={H - padB} stroke="var(--muted)" strokeWidth="1" />
            {series.map((x, i) => {
              const cx = padL + slot * i + slot / 2;
              const bar = (v: number, dx: number, c: string) => { const top = y(v), h = H - padB - top; return h > 0 ? <path d={`M${cx + dx},${H - padB} V${top + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${H - padB} Z`} fill={c} /> : null; };
              return (
                <g key={x.m} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={padL + slot * i} y={0} width={slot} height={H} fill={hover === i ? "rgba(0,0,0,.04)" : "transparent"} />
                  {bar(x.inn, -bw - 1, IN_COLOR)}{bar(x.out, 1, OUT_COLOR)}
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">{short(x.m)}</text>
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="fin-tip" style={{ left: `${((padL + slot * hover + slot / 2) / W) * 100}%` }}>
              <strong>{monthLabel(series[hover].m)}</strong><br />In {money0(series[hover].inn)}<br />Out {money0(series[hover].out)}<br />Net {money0(series[hover].net)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------- Split income: drag and drop ---------------- */
function SplitBoard({ s, monthTx, tx, month, api }: { s: FinSettings; monthTx: Tx[]; tx: Tx[]; month: string; api: (op: string, p?: Record<string, unknown>, ok?: string) => Promise<unknown> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [ask, setAsk] = useState<{ txId: string; bucket: string; amount: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const income = monthTx.filter((t) => t.type === "in" && unallocated(t) > 0);
  const outs = monthTx.filter((t) => t.type === "out" && !t.bucket);
  const monthIn = totals(monthTx).inn;
  const bal = bucketBalances(s, tx);
  const byId = (id: string) => tx.find((t) => t.id === id);

  function drop(txId: string, bucket: string) {
    const t = byId(txId); if (!t) return;
    setPicked(null); setOver(null);
    if (t.type === "out") { api("updateTx", { id: t.id, tx: { bucket } }, `Paid from ${s.buckets.find((b) => b.id === bucket)?.name}.`); return; }
    setAsk({ txId, bucket, amount: String(unallocated(t)) });
  }
  async function confirm(amount: number) {
    if (!ask) return;
    const t = byId(ask.txId); if (!t) return;
    const n = Math.min(r2(amount), unallocated(t));
    if (n <= 0) { setAsk(null); return; }
    await api("updateTx", { id: t.id, tx: { alloc: { ...t.alloc, [ask.bucket]: r2((t.alloc[ask.bucket] || 0) + n) } } }, `${money0(n)} moved to ${s.buckets.find((b) => b.id === ask.bucket)?.name}.`);
    setAsk(null);
  }
  const removeAlloc = (t: Tx, bucket: string) => { const a = { ...t.alloc }; delete a[bucket]; api("updateTx", { id: t.id, tx: { alloc: a } }, "Moved back to unsplit income."); };

  // A plain function (not a nested component) so React keeps the same element while it is being dragged
  const chip = (t: Tx) => (
    <button key={t.id} type="button" draggable className={`fin-chip ${t.type} ${picked === t.id ? "picked" : ""}`} aria-pressed={picked === t.id}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; setPicked(t.id); }}
      onDragEnd={() => setOver(null)} onClick={() => setPicked(picked === t.id ? null : t.id)}>
      <span className="amt">{money0(t.type === "in" ? unallocated(t) : t.amount)}</span>
      <span className="d">{t.desc || (t.type === "in" ? "Deposit" : "Payment")} · {day(t.date).replace(/, \d{4}$/, "")}</span>
    </button>
  );

  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="small muted" style={{ margin: 0 }}>Drag money from the left into a bucket. On a phone, tap an amount and then tap a bucket. Income is split into buckets; money out is paid from one.</p>
      <div className="fin-split">
        <div className="stack" style={{ gap: 14 }}>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="row between" style={{ gap: 8 }}><h3 style={{ margin: 0 }}>Money in to split</h3><span className="small muted">{income.length}</span></div>
            {income.length === 0 && <p className="small muted" style={{ margin: 0 }}>Nothing waiting. Add income on the Transactions tab.</p>}
            <div className="fin-chips">{income.map(chip)}</div>
            {income.length > 0 && <button type="button" className="btn btn-sm btn-dark" onClick={() => api("splitAll", { month }, "Split by your percentages.")}>Split it all by my percentages</button>}
          </section>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="row between" style={{ gap: 8 }}><h3 style={{ margin: 0 }}>Money out to assign</h3><span className="small muted">{outs.length}</span></div>
            {outs.length === 0 && <p className="small muted" style={{ margin: 0 }}>Every payment this month is assigned to a bucket.</p>}
            <div className="fin-chips">{outs.map(chip)}</div>
          </section>
        </div>
        <div className="fin-buckets">
          {s.buckets.map((b) => {
            const target = r2((monthIn * b.pct) / 100);
            const inThisMonth = r2(monthTx.reduce((a, t) => a + (t.type === "in" ? t.alloc[b.id] || 0 : 0), 0));
            const spentThisMonth = r2(monthTx.reduce((a, t) => a + (t.type === "out" && t.bucket === b.id ? t.amount : 0), 0));
            const from = monthTx.filter((t) => t.type === "in" && t.alloc[b.id]);
            const pct = target > 0 ? Math.min(100, (inThisMonth / target) * 100) : 0;
            return (
              <div key={b.id} className={`fin-bucket ${over === b.id ? "over" : ""} ${picked ? "ready" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOver(b.id); }} onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); drop(e.dataTransfer.getData("text/plain"), b.id); }}
                onClick={() => picked && drop(picked, b.id)} role={picked ? "button" : undefined} tabIndex={picked ? 0 : undefined}
                onKeyDown={(e) => { if (picked && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); drop(picked, b.id); } }}>
                <div className="row between" style={{ gap: 8 }}><strong>{b.name}</strong><span className="tag">{b.pct}%</span></div>
                <span className="tiny muted">{b.hint}</span>
                <div className="big">{money0(bal[b.id]?.balance ?? 0)}</div>
                <span className="tiny muted">in this bucket now</span>
                <div className="bar sm" aria-hidden="true" style={{ marginTop: 8 }}><span style={{ width: `${pct}%` }} /></div>
                <span className="tiny">{money0(inThisMonth)} of {money0(target)} target this month{spentThisMonth ? ` · ${money0(spentThisMonth)} spent` : ""}</span>
                {from.length > 0 && (
                  <div className="stack" style={{ gap: 2, marginTop: 6 }}>
                    {from.map((t) => <span key={t.id} className="tiny row between" style={{ gap: 6 }}><span>{t.desc || "Deposit"} {money0(t.alloc[b.id])}</span><button type="button" className="linkbtn tiny" aria-label={`Undo ${t.desc}`} onClick={(e) => { e.stopPropagation(); removeAlloc(t, b.id); }}>undo</button></span>)}
                  </div>
                )}
                {ask && ask.bucket === b.id && (() => {
                  const t = byId(ask.txId)!;
                  const tgt = Math.min(unallocated(t), Math.max(0, r2(target - inThisMonth)));
                  return (
                    <div className="fin-ask" onClick={(e) => e.stopPropagation()}>
                      <span className="small"><strong>How much of {money0(unallocated(t))} goes to {b.name}?</strong></span>
                      <input type="number" min={0} step="0.01" value={ask.amount} onChange={(e) => setAsk({ ...ask, amount: e.target.value })} aria-label="Amount" autoFocus />
                      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-sm btn-dark" onClick={() => confirm(Number(ask.amount))}>Move it</button>
                        {tgt > 0 && tgt < unallocated(t) && <button type="button" className="btn btn-sm btn-ghost" onClick={() => confirm(tgt)}>Just the target ({money0(tgt)})</button>}
                        <button type="button" className="linkbtn small" onClick={() => setAsk(null)}>Cancel</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>Many owners move the money between real bank accounts on a set rhythm, such as the 10th and 25th of each month, so the buckets here match their bank.</p>
    </div>
  );
}

/* ---------------- Transactions ---------------- */
function Transactions({ s, monthTx, month, api, as, clientId }: { s: FinSettings; monthTx: Tx[]; month: string; api: (op: string, p?: Record<string, unknown>, ok?: string) => Promise<unknown>; as: "client" | "us"; clientId: string }) {
  const blank = { date: `${month}-${month === new Date().toISOString().slice(0, 7) ? new Date().toISOString().slice(8, 10) : "01"}`, type: "out", amount: "", desc: "", category: "", bucket: "" };
  const [f, setF] = useState(blank);
  const [show, setShow] = useState<"all" | "in" | "out" | "todo">("all");
  const [imp, setImp] = useState<{ rows: { date: string; desc: string; amount: number; type: "in" | "out" }[]; error?: string } | null>(null);
  const [upFor, setUpFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const list = monthTx.filter((t) => show === "all" || (show === "todo" ? !t.category || (t.type === "out" && !t.receiptUrl) : t.type === show));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("addTx", { tx: { ...f, amount: Number(f.amount) } }, "Added.");
    if (r) setF({ ...blank, date: f.date, type: f.type });
  }
  async function receipt(file: File) {
    const t = upFor; setUpFor(null);
    if (!t) return;
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").slice(-60);
      const blob = await upload(`clients/${clientId}/receipts/${safe}`, file, { access: "public", handleUploadUrl: as === "client" ? "/api/portal/upload" : "/api/admin/upload" });
      await api("updateTx", { id: t, tx: { receiptUrl: blob.url } }, "Receipt attached.");
    } catch (err) { alert((err as Error).message || "Upload failed. You can paste a link to the receipt instead."); }
    if (fileRef.current) fileRef.current.value = "";
  }
  const cats = (t: Tx | { type: string }) => (t.type === "in" ? s.incomeCategories : s.expenseCategories);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="card fin-add" onSubmit={add}>
        <div className="seg" role="radiogroup" aria-label="Money in or out">
          {(["in", "out"] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={f.type === k} className={f.type === k ? "on" : ""} onClick={() => setF({ ...f, type: k, category: "", bucket: "" })}>{k === "in" ? "Money in" : "Money out"}</button>)}
        </div>
        <label>Date<input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label>Amount<input type="number" required min="0.01" step="0.01" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0.00" /></label>
        <label className="grow">What for<input type="text" value={f.desc} maxLength={200} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder={f.type === "in" ? "Client name or invoice" : "Vendor or what you bought"} /></label>
        <label>Category<select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">Choose</option>{cats(f).map((c) => <option key={c}>{c}</option>)}</select></label>
        {f.type === "out" && <label>Paid from<select value={f.bucket} onChange={(e) => setF({ ...f, bucket: e.target.value })}><option value="">Choose</option>{s.buckets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
        <button className="btn btn-sm btn-primary" style={{ alignSelf: "end" }}>Add</button>
      </form>

      <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="seg" role="radiogroup" aria-label="Show">
          {([["all", "All"], ["in", "Money in"], ["out", "Money out"], ["todo", "Needs a look"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={show === k} className={show === k ? "on" : ""} onClick={() => setShow(k)}>{l}</button>)}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => csvRef.current?.click()}>Import from your bank (CSV)</button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Bank CSV file" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setImp(parseBankCsv(await file.text())); e.target.value = ""; }} />
        </div>
      </div>

      {imp && (
        <section className="card stack" style={{ gap: 10, borderTop: "3px solid var(--gold)" }}>
          {imp.error ? <p className="error-text" style={{ margin: 0 }}>{imp.error}</p> : (
            <>
              <strong>{imp.rows.length} transactions found</strong>
              <span className="small muted">{imp.rows.filter((r) => r.type === "in").length} in, {imp.rows.filter((r) => r.type === "out").length} out. Anything you already entered with the same date, amount, and description is skipped. You can add categories after.</span>
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="btn btn-sm btn-dark" onClick={async () => { const r = (await api("import", { rows: imp.rows })) as { added?: number; skipped?: number } | null; if (r) { setImp(null); alert(`Imported ${r.added}. Skipped ${r.skipped} already entered.`); } }}>Import them</button>
                <button type="button" className="linkbtn small" onClick={() => setImp(null)}>Cancel</button>
              </div>
            </>
          )}
        </section>
      )}

      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="sr-only" aria-label="Receipt file" onChange={(e) => e.target.files?.[0] && receipt(e.target.files[0])} />
      {list.length === 0 ? <p className="muted">No transactions here for {monthLabel(month)}.</p> : (
        <div className="fin-list">
          {list.map((t) => (
            <div key={t.id} className="fin-row">
              <span className={`amt ${t.type}`}>{t.type === "in" ? "+" : "-"}{money0(t.amount)}</span>
              <span className="desc"><strong>{t.desc || (t.type === "in" ? "Deposit" : "Payment")}</strong><span className="tiny muted">{day(t.date)}{t.source === "import" ? " · from bank" : ""}</span></span>
              <select aria-label="Category" value={t.category} className={t.category ? "" : "need"} onChange={(e) => api("updateTx", { id: t.id, tx: { category: e.target.value } })}><option value="">Category?</option>{cats(t).map((c) => <option key={c}>{c}</option>)}</select>
              {t.type === "out"
                ? <select aria-label="Paid from" value={t.bucket} onChange={(e) => api("updateTx", { id: t.id, tx: { bucket: e.target.value } })}><option value="">Paid from?</option>{s.buckets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                : <span className="tiny muted">{unallocated(t) > 0 ? `${money0(unallocated(t))} not split` : "Split"}</span>}
              <span className="row" style={{ gap: 8 }}>
                {t.type === "out" && (t.receiptUrl
                  ? <a className="small" href={t.receiptUrl} target="_blank" rel="noopener noreferrer">Receipt</a>
                  : <button type="button" className="linkbtn small" onClick={() => { setUpFor(t.id); fileRef.current?.click(); }}>Add receipt</button>)}
                <button type="button" className="linkbtn small" aria-label={`Delete ${t.desc}`} onClick={() => confirm("Delete this transaction?") && api("deleteTx", { id: t.id }, "Deleted.")}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="tiny muted" style={{ margin: 0 }}>To get a CSV: in your bank&rsquo;s website, open the account, choose Download or Export transactions, and pick CSV.</p>
    </div>
  );
}

/* ---------------- Budget ---------------- */
function Budget({ s, monthTx, save }: { s: FinSettings; monthTx: Tx[]; save: (p: Partial<FinSettings>, ok?: string) => Promise<unknown> }) {
  const [plan, setPlan] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(s.budget).map(([k, v]) => [k, String(v)])));
  const actual = (cat: string, type: "in" | "out") => r2(monthTx.filter((t) => t.type === type && t.category === cat).reduce((a, t) => a + t.amount, 0));
  const commit = () => save({ budget: Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, Number(v) || 0])) }, "Budget saved.");
  const table = (title: string, cats: string[], type: "in" | "out") => {
    const totP = cats.reduce((a, c) => a + (Number(plan[c]) || 0), 0), totA = cats.reduce((a, c) => a + actual(c, type), 0);
    return (
      <section className="card stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <table className="fin-table">
          <thead><tr><th>Category</th><th>Planned each month</th><th>Actual</th><th>{type === "in" ? "Vs. plan" : "Left"}</th></tr></thead>
          <tbody>
            {cats.map((c) => {
              const p = Number(plan[c]) || 0, a = actual(c, type), diff = r2(type === "in" ? a - p : p - a);
              return (
                <tr key={c}>
                  <td>{c}</td>
                  <td><input type="number" min={0} step="1" inputMode="decimal" value={plan[c] ?? ""} placeholder="0" aria-label={`Planned for ${c}`} onChange={(e) => setPlan({ ...plan, [c]: e.target.value })} onBlur={commit} style={{ maxWidth: 130 }} /></td>
                  <td>{money0(a)}</td>
                  <td style={{ color: p && diff < 0 ? "#9b2317" : undefined }}>{p ? money0(diff) : ""}</td>
                </tr>
              );
            })}
            <tr className="tot"><td>Total</td><td>{money0(totP)}</td><td>{money0(totA)}</td><td>{totP ? money0(r2(type === "in" ? totA - totP : totP - totA)) : ""}</td></tr>
          </tbody>
        </table>
      </section>
    );
  };
  return <div className="stack" style={{ gap: 16 }}><p className="small muted" style={{ margin: 0 }}>Set what you expect each month. Actuals fill in from your transactions. Red means over budget on spending, or under plan on income.</p>{table("Income", s.incomeCategories, "in")}{table("Spending", s.expenseCategories, "out")}</div>;
}

/* ---------------- Invoices and bills ---------------- */
function OwedList({ s, today, save, api }: { s: FinSettings; today: string; save: (p: Partial<FinSettings>, ok?: string) => Promise<unknown>; api: (op: string, p?: Record<string, unknown>, ok?: string) => Promise<unknown> }) {
  const [f, setF] = useState({ kind: "receivable" as Owed["kind"], name: "", amount: "", due: "" });
  const open = s.owed.filter((o) => o.status === "open").sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  const paid = s.owed.filter((o) => o.status === "paid");
  const sum = (k: Owed["kind"]) => r2(open.filter((o) => o.kind === k).reduce((a, o) => a + o.amount, 0));
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await save({ owed: [...s.owed, { id: "", kind: f.kind, name: f.name, amount: Number(f.amount), due: f.due, status: "open", note: "", paidTxId: "" }] }, "Added.");
    if (r) setF({ ...f, name: "", amount: "", due: "" });
  }
  const row = (o: Owed) => (
    <div key={o.id} className="fin-row">
      <span className={`amt ${o.kind === "receivable" ? "in" : "out"}`}>{money0(o.amount)}</span>
      <span className="desc"><strong>{o.name}</strong><span className="tiny muted">{o.kind === "receivable" ? "Owed to you" : "You owe"}{o.due ? ` · due ${day(o.due)}` : ""}</span></span>
      {o.status === "open" && o.due && o.due < today ? <span className="tag rust">Past due</span> : <span />}
      <span />
      <span className="row" style={{ gap: 10 }}>
        {o.status === "open" ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => api("payOwed", { id: o.id, date: today }, o.kind === "receivable" ? "Marked paid and added to money in." : "Marked paid and added to money out.")}>Mark paid</button> : <span className="tiny muted">Paid</span>}
        <button type="button" className="linkbtn small" onClick={() => confirm("Remove this?") && save({ owed: s.owed.filter((x) => x.id !== o.id) }, "Removed.")}>Remove</button>
      </span>
    </div>
  );
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="fin-tiles">
        <div><span className="k">Owed to you</span><span className="v">{money0(sum("receivable"))}</span></div>
        <div><span className="k">You owe</span><span className="v">{money0(sum("payable"))}</span></div>
      </div>
      <form className="card fin-add" onSubmit={add}>
        <div className="seg" role="radiogroup" aria-label="Type">
          {([["receivable", "Invoice I sent"], ["payable", "Bill I owe"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.kind === k} className={f.kind === k ? "on" : ""} onClick={() => setF({ ...f, kind: k })}>{l}</button>)}
        </div>
        <label className="grow">{f.kind === "receivable" ? "Who owes you" : "Who you owe"}<input type="text" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Amount<input type="number" required min="0.01" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
        <label>Due<input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
        <button className="btn btn-sm btn-primary" style={{ alignSelf: "end" }}>Add</button>
      </form>
      {open.length === 0 ? <p className="muted">Nothing open. Add invoices you have sent and bills you need to pay so nothing slips.</p> : <div className="fin-list">{open.map(row)}</div>}
      {paid.length > 0 && <details><summary className="small" style={{ cursor: "pointer" }}>Paid ({paid.length})</summary><div className="fin-list" style={{ marginTop: 10 }}>{paid.map(row)}</div></details>}
    </div>
  );
}

/* ---------------- Taxes ---------------- */
function Taxes({ s, tx, today, save }: { s: FinSettings; tx: Tx[]; today: string; save: (p: Partial<FinSettings>, ok?: string) => Promise<unknown> }) {
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const dates = estimatedTaxDates(year);
  const bal = bucketBalances(s, tx);
  const pay = (q: string) => s.taxPayments.find((p) => p.quarter === q);
  const [draft, setDraft] = useState<Record<string, { amount: string; paidOn: string }>>({});
  const set = (q: string, k: "amount" | "paidOn", v: string) => setDraft({ ...draft, [q]: { amount: draft[q]?.amount ?? String(pay(q)?.amount ?? ""), paidOn: draft[q]?.paidOn ?? pay(q)?.paidOn ?? "", [k]: v } });
  const commit = (q: string) => { const d = draft[q]; if (!d) return; save({ taxPayments: [...s.taxPayments.filter((p) => p.quarter !== q), { quarter: q, amount: Number(d.amount) || 0, paidOn: d.paidOn }] }, "Saved."); };
  const ytdNet = totals(tx.filter((t) => t.date.startsWith(String(year)))).net;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="fin-tiles">
        <div><span className="k">In your Taxes bucket</span><span className="v">{money0(bal.tax?.balance ?? 0)}</span></div>
        <div><span className="k">Net for {year} so far</span><span className="v">{money0(ytdNet)}</span></div>
        <div><span className="k">Estimated tax paid in {year}</span><span className="v">{money0(r2(dates.reduce((a, d) => a + (pay(d.quarter)?.amount || 0), 0)))}</span></div>
      </div>
      <section className="card stack" style={{ gap: 8 }}>
        <div className="row between" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Federal estimated tax dates (Form 1040-ES)</h3>
          <span className="row" style={{ gap: 6 }}><button type="button" className="btn btn-sm btn-ghost" onClick={() => setYear(year - 1)} aria-label="Previous year">&larr;</button><strong>{year}</strong><button type="button" className="btn btn-sm btn-ghost" onClick={() => setYear(year + 1)} aria-label="Next year">&rarr;</button></span>
        </div>
        <table className="fin-table">
          <thead><tr><th>Payment</th><th>Due</th><th>Amount paid</th><th>Paid on</th></tr></thead>
          <tbody>
            {dates.map((d) => {
              const p = pay(d.quarter), next = d.due >= today && !dates.some((x) => x.due >= today && x.due < d.due);
              return (
                <tr key={d.quarter} style={next ? { background: "var(--cream)" } : undefined}>
                  <td><strong>{d.label}</strong><br /><span className="tiny muted">covers {d.covers}</span>{next && <><br /><span className="tag gold">Next up</span></>}</td>
                  <td>{day(d.due)}</td>
                  <td><input type="number" min={0} step="0.01" aria-label={`Amount paid for ${d.label}`} value={draft[d.quarter]?.amount ?? (p?.amount || "")} onChange={(e) => set(d.quarter, "amount", e.target.value)} onBlur={() => commit(d.quarter)} style={{ maxWidth: 130 }} /></td>
                  <td><input type="date" aria-label={`Date paid for ${d.label}`} value={draft[d.quarter]?.paidOn ?? p?.paidOn ?? ""} onChange={(e) => set(d.quarter, "paidOn", e.target.value)} onBlur={() => commit(d.quarter)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="tiny muted" style={{ margin: 0 }}>Dates that land on a weekend move to the next business day; check the IRS website for holidays and any disaster extensions. Your state may have its own dates. A tax professional should tell you how much to pay; these are reminders, not advice.</p>
      </section>
    </div>
  );
}

/* ---------------- Month-end ---------------- */
function MonthEnd({ s, month, monthTx, save }: { s: FinSettings; month: string; monthTx: Tx[]; save: (p: Partial<FinSettings>, ok?: string) => Promise<unknown> }) {
  // Ticks show right away; the save happens in the background
  const [local, setLocal] = useState<Record<string, Record<string, boolean>>>(s.checklist);
  const done = local[month] ?? {};
  const n = CHECKLIST.filter((c) => done[c.id]).length;
  const toggle = (id: string) => { const next = { ...local, [month]: { ...done, [id]: !done[id] } }; setLocal(next); save({ checklist: next }, ""); };
  const hints: Record<string, string> = {
    categorize: `${monthTx.filter((t) => !t.category).length} without a category`,
    receipts: `${monthTx.filter((t) => t.type === "out" && !t.receiptUrl).length} expenses without a receipt`,
    allocate: `${money0(r2(monthTx.reduce((a, t) => a + unallocated(t), 0)))} not split yet`,
    reconcile: `Totals here: ${money0(totals(monthTx).inn)} in, ${money0(totals(monthTx).out)} out`,
  };
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Close out {monthLabel(month)}</h3><span className={`tag ${n === CHECKLIST.length ? "green" : ""}`}>{n} of {CHECKLIST.length}</span></div>
      <p className="small muted" style={{ margin: 0 }}>The same steps a bookkeeper runs at the end of every month. About 30 minutes once it is a habit.</p>
      {CHECKLIST.map((c) => (
        <label key={c.id} className="row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "nowrap", borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <input type="checkbox" style={{ width: "auto", marginTop: 4 }} checked={!!done[c.id]} onChange={() => toggle(c.id)} />
          <span>{c.label}{hints[c.id] && <><br /><span className="tiny muted">{hints[c.id]}</span></>}</span>
        </label>
      ))}
    </section>
  );
}

/* ---------------- Reports ---------------- */
function Reports({ s, tx, month, clientName }: { s: FinSettings; tx: Tx[]; month: string; clientName: string }) {
  const [range, setRange] = useState<"month" | "ytd">("month");
  const list = useMemo(() => tx.filter((t) => (range === "month" ? monthOf(t.date) === month : t.date.slice(0, 4) === month.slice(0, 4) && monthOf(t.date) <= month)), [tx, range, month]);
  const by = (type: "in" | "out") => {
    const m = new Map<string, number>();
    for (const t of list.filter((x) => x.type === type)) m.set(t.category || "Not categorized", r2((m.get(t.category || "Not categorized") || 0) + t.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const inc = by("in"), exp = by("out"), t = totals(list);
  const title = range === "month" ? monthLabel(month) : `January to ${monthLabel(month)}`;
  function csv(rows: (string | number)[][], name: string) {
    const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); a.download = name; a.click();
  }
  const bname = (id: string) => s.buckets.find((b) => b.id === id)?.name ?? "";
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between no-print" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="seg" role="radiogroup" aria-label="Range">
          {([["month", "This month"], ["ytd", "Year to date"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={range === k} className={range === k ? "on" : ""} onClick={() => setRange(k)}>{l}</button>)}
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => csv([["Date", "Type", "Amount", "Description", "Category", "Paid from bucket", "Split into buckets", "Receipt"], ...list.slice().reverse().map((x) => [x.date, x.type === "in" ? "Money in" : "Money out", x.type === "in" ? x.amount : -x.amount, x.desc, x.category, bname(x.bucket), Object.entries(x.alloc).map(([k, v]) => `${bname(k)} ${v}`).join("; "), x.receiptUrl])], `transactions-${range === "month" ? month : month.slice(0, 4)}.csv`)}>Download transactions (CSV)</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => csv([["Profit and loss", title], [], ["Income"], ...inc.map(([c, v]) => [c, v]), ["Total income", t.inn], [], ["Expenses"], ...exp.map(([c, v]) => [c, v]), ["Total expenses", t.out], [], ["Net", t.net]], `profit-and-loss-${range === "month" ? month : month.slice(0, 4)}.csv`)}>Download profit and loss (CSV)</button>
          <button type="button" className="btn btn-sm btn-dark" onClick={() => window.print()}>Print or save as PDF</button>
        </div>
      </div>
      <section className="card stack fin-report" style={{ gap: 8 }}>
        <span className="eyebrow">Profit and loss</span>
        <h3 style={{ margin: 0 }}>{clientName} · {title}</h3>
        <table className="fin-table">
          <tbody>
            <tr className="sec"><td colSpan={2}>Income</td></tr>
            {inc.length === 0 && <tr><td className="muted">None recorded</td><td /></tr>}
            {inc.map(([c, v]) => <tr key={c}><td>{c}</td><td>{money0(v)}</td></tr>)}
            <tr className="tot"><td>Total income</td><td>{money0(t.inn)}</td></tr>
            <tr className="sec"><td colSpan={2}>Expenses</td></tr>
            {exp.length === 0 && <tr><td className="muted">None recorded</td><td /></tr>}
            {exp.map(([c, v]) => <tr key={c}><td>{c}</td><td>{money0(v)}</td></tr>)}
            <tr className="tot"><td>Total expenses</td><td>{money0(t.out)}</td></tr>
            <tr className="tot net"><td>Net {t.net < 0 ? "loss" : "profit"}</td><td>{money0(t.net)}</td></tr>
          </tbody>
        </table>
        <p className="tiny muted" style={{ margin: 0 }}>Cash basis: counted when money moved. Owner draws and tax payments are listed with expenses here; your accountant may treat them differently.</p>
      </section>
    </div>
  );
}

/* ---------------- Set up ---------------- */
function Setup({ s, save }: { s: FinSettings; save: (p: Partial<FinSettings>, ok?: string) => Promise<unknown> }) {
  const [buckets, setBuckets] = useState(s.buckets);
  const [opening, setOpening] = useState<Record<string, string>>(Object.fromEntries(Object.entries(s.opening).map(([k, v]) => [k, String(v)])));
  const [inc, setInc] = useState(s.incomeCategories.join("\n"));
  const [exp, setExp] = useState(s.expenseCategories.join("\n"));
  const total = buckets.reduce((a, b) => a + (Number(b.pct) || 0), 0);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <section className="card stack" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>Your buckets</h3>
        <p className="small muted" style={{ margin: 0 }}>Every dollar that comes in gets split by these percentages. The starting split (5% profit, 50% owner&rsquo;s pay, 15% taxes, 30% operating) is a common starting point for businesses under $250,000 a year, from the Profit First method. Move toward your own numbers a little each quarter.</p>
        {buckets.map((b, i) => (
          <div key={b.id} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input type="text" aria-label="Bucket name" value={b.name} onChange={(e) => setBuckets(buckets.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} style={{ flex: "1 1 180px" }} />
            <label className="row" style={{ gap: 6 }}><input type="number" min={0} max={100} aria-label={`${b.name} percent`} value={b.pct} onChange={(e) => setBuckets(buckets.map((x, k) => (k === i ? { ...x, pct: Number(e.target.value) } : x)))} style={{ width: 80 }} />%</label>
            <label className="row" style={{ gap: 6 }}><span className="small">Already have</span><input type="number" step="0.01" aria-label={`${b.name} starting balance`} value={opening[b.id] ?? ""} placeholder="0" onChange={(e) => setOpening({ ...opening, [b.id]: e.target.value })} style={{ width: 120 }} /></label>
            {buckets.length > 1 && !["tax"].includes(b.id) && <button type="button" className="linkbtn small" onClick={() => setBuckets(buckets.filter((_, k) => k !== i))}>Remove</button>}
          </div>
        ))}
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {buckets.length < 10 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setBuckets([...buckets, { id: `b${Date.now().toString(36)}`, name: "New bucket", pct: 0, hint: "" }])}>+ Add a bucket</button>}
          <span className={`small ${total === 100 ? "ok-text" : "error-text"}`}>Adds up to {total}%{total !== 100 ? ". Aim for 100%." : "."}</span>
        </div>
        <div><button type="button" className="btn btn-sm btn-dark" onClick={() => save({ buckets, opening: Object.fromEntries(Object.entries(opening).map(([k, v]) => [k, Number(v) || 0])) } as Partial<FinSettings>, "Buckets saved.")}>Save buckets</button></div>
      </section>
      <section className="card stack" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>Categories</h3>
        <p className="small muted" style={{ margin: 0 }}>One per line. Matching your tax return&rsquo;s categories makes tax time easier, so ask your accountant if they have a list.</p>
        <div className="grid-2" style={{ gap: 14 }}>
          <label>Income<textarea rows={8} value={inc} onChange={(e) => setInc(e.target.value)} /></label>
          <label>Spending<textarea rows={8} value={exp} onChange={(e) => setExp(e.target.value)} /></label>
        </div>
        <div><button type="button" className="btn btn-sm btn-dark" onClick={() => save({ incomeCategories: inc.split("\n"), expenseCategories: exp.split("\n") }, "Categories saved.")}>Save categories</button></div>
      </section>
    </div>
  );
}
