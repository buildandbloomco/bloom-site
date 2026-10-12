"use client";

import { useState } from "react";
import { activeShare, employerDates, money0, monthLabel, nec1099Threshold, r2, shiftMonth, totals, type FinSettings, type Person, type ShareLevel, type Tx } from "@/lib/finance-def";
import type { Tab } from "./MoneyBoard";

export interface Summary { months: Record<string, { inn: number; out: number }>; teamCost: Record<string, number>; headcount: number | null; buckets: Record<string, number> }
type Api = (op: string, p?: Record<string, unknown>, ok?: string) => Promise<unknown>;
const day = (d: string) => (d ? new Date(d.length > 10 ? d : d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const addDays = (today: string, n: number) => { const d = new Date(today + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ---------------- The client's privacy control ---------------- */
export function PrivacyBar({ s, api, today }: { s: FinSettings; api: Api; today: string }) {
  const sh = activeShare(s, today);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<ShareLevel>(sh.level === "private" ? "full" : sh.level);
  const [team, setTeam] = useState(sh.includeTeam);
  const [length, setLength] = useState<"7" | "30" | "">(sh.until ? "30" : "7");
  const last = s.accessLog?.[0];
  const save = async (lv: ShareLevel, inc: boolean, len: string) => {
    await api("share", { level: lv, includeTeam: inc, until: lv === "private" || !len ? "" : addDays(today, Number(len)) }, lv === "private" ? "Your Money is private." : "Sharing updated.");
    setOpen(false);
  };
  const status = sh.level === "private" ? "Private. Only you can see your Money." : sh.level === "summary" ? "Sharing a summary with Build & Bloom: monthly totals and bucket balances, no transactions." : `Sharing everything with Build & Bloom to review, view only${sh.includeTeam ? ", including team pay" : ""}.`;
  return (
    <div className="stack" style={{ gap: 10 }}>
      {s.accessRequest && sh.level === "private" && (
        <div className="banner warn row between" style={{ margin: 0, gap: 12, flexWrap: "wrap" }}>
          <span><strong>Build &amp; Bloom asked to review your Money.</strong>{s.accessRequest.note ? ` "${s.accessRequest.note}"` : ""} You decide what they see and for how long.</span>
          <span className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-sm btn-dark" onClick={() => save("full", false, "7")}>Share for 7 days</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>Choose what to share</button>
            <button type="button" className="linkbtn small" onClick={() => api("dismissRequest", {}, "Request dismissed. Nothing was shared.")}>Not now</button>
          </span>
        </div>
      )}
      <div className={`fin-privacy ${sh.level}`}>
        <span className="row" style={{ gap: 10, alignItems: "center" }}>
          <span aria-hidden="true" className="lock">{sh.level === "private" ? "🔒" : "👁"}</span>
          <span className="small"><strong>{status}</strong>{sh.until && sh.level !== "private" ? ` Ends ${day(sh.until)}.` : ""}{last ? ` Build & Bloom last looked ${day(last)}.` : ""}</span>
        </span>
        <span className="row" style={{ gap: 8 }}>
          {sh.level !== "private" && <button type="button" className="btn btn-sm btn-ghost" onClick={() => save("private", false, "")}>Make private</button>}
          <button type="button" className="btn btn-sm btn-dark" onClick={() => setOpen(!open)}>{open ? "Close" : "Sharing settings"}</button>
        </span>
      </div>
      {open && (
        <section className="card stack" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>Who can see your Money</h3>
          <p className="small muted" style={{ margin: 0 }}>Your Money is yours. Work on it privately, and share it with Build &amp; Bloom only when you want a review. Build &amp; Bloom can never change anything here, and you can stop sharing at any time.</p>
          {([["private", "Keep it private", "Build & Bloom sees only that Money is turned on."], ["summary", "Share a summary", "Monthly totals in and out, and your bucket balances. No individual transactions, receipts, or notes."], ["full", "Share everything to review", "Everything on these tabs, view only, so we can go through it together."]] as const).map(([k, t, d]) => (
            <label key={k} className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
              <input type="radio" name="share" style={{ width: "auto", marginTop: 5 }} checked={level === k} onChange={() => setLevel(k)} />
              <span><strong>{t}</strong><br /><span className="small muted">{d}</span></span>
            </label>
          ))}
          {level !== "private" && (
            <>
              <label className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
                <input type="checkbox" style={{ width: "auto", marginTop: 5 }} checked={team} onChange={(e) => setTeam(e.target.checked)} />
                <span><strong>Include team pay</strong><br /><span className="small muted">Off by default. Turn it on only if you want help with payroll or contractor costs.</span></span>
              </label>
              <label style={{ maxWidth: 280 }}>For how long<select value={length} onChange={(e) => setLength(e.target.value as typeof length)}><option value="7">7 days</option><option value="30">30 days</option><option value="">Until I turn it off</option></select></label>
            </>
          )}
          <div><button type="button" className="btn btn-sm btn-primary" onClick={() => save(level, team, length)}>Save</button></div>
          {(s.accessLog?.length ?? 0) > 0 && (
            <details><summary className="small" style={{ cursor: "pointer" }}>When Build &amp; Bloom looked</summary>
              <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>{s.accessLog.slice(0, 10).map((a) => <li key={a}>{new Date(a).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</li>)}</ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------------- What you see in admin ---------------- */
export function AdminLocked({ s, clientName, api, msg }: { s: FinSettings; clientName: string; api: Api; msg: string }) {
  const [note, setNote] = useState("");
  return (
    <section className="card stack" style={{ gap: 12 }}>
      <h3 style={{ margin: 0 }}>🔒 {clientName} keeps Money private</h3>
      <p className="small muted" style={{ margin: 0 }}>Their numbers stay with them until they choose to share. When they do, you can view it here, and they see each time you look.</p>
      {s.accessRequest ? <p className="small" style={{ margin: 0 }}>You asked to review on {day(s.accessRequest.at)}. It shows at the top of their Money page until they answer.</p> : (
        <>
          <label>Ask to review <span className="hint">They see this note</span><input type="text" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Before Thursday's session, I'd love to look at last month together." /></label>
          <div><button type="button" className="btn btn-sm btn-dark" onClick={() => api("requestAccess", { note }, "Request sent. It is at the top of their Money page.")}>Ask to review</button></div>
        </>
      )}
      {msg && <span className="small" role="status">{msg}</span>}
    </section>
  );
}

export function AdminSummary({ s, summary, clientName, today }: { s: FinSettings; summary: Summary; clientName: string; today: string }) {
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(today.slice(0, 7), i - 5));
  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="small muted" style={{ margin: 0 }}>{clientName} is sharing a summary: monthly totals and bucket balances. They see each time you look.</p>
      <section className="card stack" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>Last six months</h3>
        <table className="fin-table"><thead><tr><th>Month</th><th>In</th><th>Out</th><th>Net</th>{s.share.includeTeam && <th>Team cost</th>}</tr></thead>
          <tbody>{months.map((m) => { const x = summary.months[m] ?? { inn: 0, out: 0 }; return <tr key={m}><td>{monthLabel(m)}</td><td>{money0(x.inn)}</td><td>{money0(x.out)}</td><td>{money0(r2(x.inn - x.out))}</td>{s.share.includeTeam && <td>{money0(summary.teamCost[m] ?? 0)}</td>}</tr>; })}</tbody>
        </table>
      </section>
      <section className="card stack" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>Bucket balances</h3>
        {(s as FinSettings).buckets?.map((b) => <div key={b.id} className="row between small" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}><span><strong>{b.name}</strong> {b.pct}%</span><strong>{money0(summary.buckets[b.id] ?? 0)}</strong></div>)}
        {summary.headcount !== null && <p className="small" style={{ margin: 0 }}>Active team members: {summary.headcount}</p>}
      </section>
    </div>
  );
}

/* ---------------- Team: staff and contractor pay ---------------- */
export function Team({ s, tx, today, save, api }: { s: FinSettings; tx: Tx[]; today: string; save: (p: Partial<FinSettings>, ok?: string) => Promise<unknown>; api: Api }) {
  const year = today.slice(0, 4), month = today.slice(0, 7);
  const [p, setP] = useState({ name: "", role: "", kind: "employee" as Person["kind"], payType: "hourly" as Person["payType"], rate: "", start: "" });
  const [pay, setPay] = useState({ personId: "", date: today, gross: "", employerCost: "", reimbursement: "", hours: "", note: "", alsoTx: true });
  const [yr, setYr] = useState(Number(year));
  const person = (id: string) => s.people.find((x) => x.id === id);
  const cost = (r: { gross: number; employerCost: number }) => r2(r.gross + r.employerCost);
  const inYear = (y: string) => s.pay.filter((r) => r.date.startsWith(y));
  const monthCost = r2(s.pay.filter((r) => r.date.startsWith(month)).reduce((a, r) => a + cost(r), 0));
  const yearCost = r2(inYear(year).reduce((a, r) => a + cost(r), 0));
  const yearIn = totals(tx.filter((t) => t.date.startsWith(year))).inn;
  const ytd = (id: string, y = year) => r2(inYear(y).filter((r) => r.personId === id).reduce((a, r) => a + r.gross, 0));
  const threshold = nec1099Threshold(Number(year));
  const contractors = s.people.filter((x) => x.kind === "contractor");
  const sel = person(pay.personId);
  // Checkboxes flip right away; the server reply then confirms.
  const [opt, setOpt] = useState<Record<string, boolean>>({});
  const flip = (key: string, v: boolean, p: Promise<unknown>) => { setOpt((o) => ({ ...o, [key]: v })); p.finally(() => setOpt((o) => { const n = { ...o }; delete n[key]; return n; })); };
  const hasDoc = (x: Person, k: keyof Person["docs"]) => opt[`d:${x.id}:${k}`] ?? !!x.docs[k];
  const filed = (k: string) => opt[`f:${k}`] ?? !!s.filings[k];
  const setDoc = (id: string, k: keyof Person["docs"], v: boolean) => flip(`d:${id}:${k}`, v, save({ people: s.people.map((x) => (x.id === id ? { ...x, docs: { ...x.docs, [k]: v } } : x)) }, "Saved."));

  async function addPerson(e: React.FormEvent) {
    e.preventDefault();
    const r = await save({ people: [...s.people, { id: "", name: p.name, role: p.role, kind: p.kind, payType: p.kind === "contractor" && p.payType === "salary" ? "project" : p.payType, rate: Number(p.rate) || 0, start: p.start, active: true, docs: {} }] }, `${p.name} added.`);
    if (r) setP({ ...p, name: "", role: "", rate: "", start: "" });
  }
  async function addPay(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("addPay", { pay: { ...pay, gross: Number(pay.gross), employerCost: Number(pay.employerCost), reimbursement: Number(pay.reimbursement), hours: Number(pay.hours) }, alsoTx: pay.alsoTx }, pay.alsoTx ? "Payment recorded and added to Money out." : "Payment recorded.");
    if (r) setPay({ ...pay, gross: "", employerCost: "", reimbursement: "", hours: "", note: "" });
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="fin-tiles">
        <div><span className="k">Team cost this month</span><span className="v">{money0(monthCost)}</span></div>
        <div><span className="k">Team cost in {year}</span><span className="v">{money0(yearCost)}</span></div>
        <div><span className="k">Share of money in</span><span className="v">{yearIn ? `${Math.round((yearCost / yearIn) * 100)}%` : "None yet"}</span></div>
        <div><span className="k">Active team</span><span className="v">{s.people.filter((x) => x.active && x.kind === "employee").length} staff · {((n) => `${n} contractor${n === 1 ? "" : "s"}`)(s.people.filter((x) => x.active && x.kind === "contractor").length)}</span></div>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>Team cost is gross pay plus employer taxes and benefits. Reimbursements are tracked separately. Comparing team cost to money in each month shows whether a new hire is affordable.</p>

      <section className="card stack" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>Your team</h3>
        {s.people.length === 0 && <p className="small muted" style={{ margin: 0 }}>Add the people you pay: employees (paid through payroll, with taxes withheld) and contractors (paid per job, sent a 1099).</p>}
        {s.people.map((x) => (
          <div key={x.id} className="fin-person">
            <div className="stack" style={{ gap: 2, minWidth: 0 }}>
              <strong>{x.name}{!x.active && <span className="tag" style={{ marginLeft: 8 }}>Inactive</span>}</strong>
              <span className="tiny muted">{[x.role, x.kind === "employee" ? "Employee" : "Contractor", x.rate ? `${money0(x.rate)} ${x.payType === "hourly" ? "an hour" : x.payType === "salary" ? "a year" : "a project"}` : "", x.start && `since ${day(x.start)}`].filter(Boolean).join(" · ")}</span>
              <span className="tiny">Paid in {year}: <strong>{money0(ytd(x.id))}</strong></span>
            </div>
            <div className="row small" style={{ gap: 12, flexWrap: "wrap" }}>
              <span className="tiny muted">On file:</span>
              {(x.kind === "employee" ? [["w4", "W-4"], ["i9", "I-9"]] : [["w9", "W-9"]]).concat([["agreement", x.kind === "employee" ? "Offer letter" : "Contract"]]).map(([k, l]) => (
                <label key={k} className="row" style={{ gap: 4 }}><input type="checkbox" style={{ width: "auto" }} checked={hasDoc(x, k as keyof Person["docs"])} onChange={(e) => setDoc(x.id, k as keyof Person["docs"], e.target.checked)} />{l}</label>
              ))}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="linkbtn small" onClick={() => save({ people: s.people.map((y) => (y.id === x.id ? { ...y, active: !y.active } : y)) }, "Saved.")}>{x.active ? "Mark inactive" : "Mark active"}</button>
              {!s.pay.some((r) => r.personId === x.id) && <button type="button" className="linkbtn small" onClick={() => confirm(`Remove ${x.name}?`) && save({ people: s.people.filter((y) => y.id !== x.id) }, "Removed.")}>Remove</button>}
            </div>
          </div>
        ))}
        <form className="fin-add" onSubmit={addPerson} style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div className="seg" role="radiogroup" aria-label="Type">
            {([["employee", "Employee"], ["contractor", "Contractor"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={p.kind === k} className={p.kind === k ? "on" : ""} onClick={() => setP({ ...p, kind: k, payType: k === "contractor" ? "project" : "hourly" })}>{l}</button>)}
          </div>
          <label className="grow">Name<input type="text" required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
          <label>Role<input type="text" value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })} /></label>
          <label>Paid<select value={p.payType} onChange={(e) => setP({ ...p, payType: e.target.value as Person["payType"] })}><option value="hourly">Hourly</option>{p.kind === "employee" && <option value="salary">Salary</option>}<option value="project">Per project</option></select></label>
          <label>Rate<input type="number" min={0} step="0.01" value={p.rate} onChange={(e) => setP({ ...p, rate: e.target.value })} placeholder={p.payType === "salary" ? "Per year" : p.payType === "hourly" ? "Per hour" : "Typical fee"} /></label>
          <label>Start date<input type="date" value={p.start} onChange={(e) => setP({ ...p, start: e.target.value })} /></label>
          <button className="btn btn-sm btn-primary" style={{ alignSelf: "end" }}>Add</button>
        </form>
        <p className="tiny muted" style={{ margin: 0 }}>Please don&rsquo;t enter Social Security numbers, addresses, or bank details here. Keep W-4s, I-9s, and W-9s with your payroll provider or in locked files; this only tracks that they are on file.</p>
      </section>

      {s.people.length > 0 && (
        <section className="card stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Record a payment</h3>
          <form className="fin-add" onSubmit={addPay}>
            <label className="grow">Who<select required value={pay.personId} onChange={(e) => setPay({ ...pay, personId: e.target.value })}><option value="">Choose</option>{s.people.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label>Pay date<input type="date" required value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></label>
            <label>{sel?.kind === "contractor" ? "Amount paid" : "Gross pay"}<input type="number" min={0} step="0.01" required value={pay.gross} onChange={(e) => setPay({ ...pay, gross: e.target.value })} /></label>
            {sel?.kind !== "contractor" && <label>Employer taxes and benefits<input type="number" min={0} step="0.01" value={pay.employerCost} onChange={(e) => setPay({ ...pay, employerCost: e.target.value })} placeholder="From your payroll report" /></label>}
            <label>Reimbursements<input type="number" min={0} step="0.01" value={pay.reimbursement} onChange={(e) => setPay({ ...pay, reimbursement: e.target.value })} /></label>
            {sel?.payType === "hourly" && <label>Hours<input type="number" min={0} step="0.25" value={pay.hours} onChange={(e) => setPay({ ...pay, hours: e.target.value })} /></label>}
            <button className="btn btn-sm btn-primary" style={{ alignSelf: "end" }}>Record</button>
          </form>
          <label className="row small" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={pay.alsoTx} onChange={(e) => setPay({ ...pay, alsoTx: e.target.checked })} />Also add the total to Money out (paid from Operating expenses). Turn this off if your bank import already has it.</label>
          {s.pay.length > 0 && (
            <details>
              <summary className="small" style={{ cursor: "pointer" }}>Payment history ({s.pay.length})</summary>
              <table className="fin-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Date</th><th>Who</th><th>Gross</th><th>Employer cost</th><th>Reimbursed</th><th></th></tr></thead>
                <tbody>{[...s.pay].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60).map((r) => (
                  <tr key={r.id}><td>{day(r.date)}</td><td>{person(r.personId)?.name}</td><td>{money0(r.gross)}</td><td>{r.employerCost ? money0(r.employerCost) : ""}</td><td>{r.reimbursement ? money0(r.reimbursement) : ""}</td>
                    <td><button type="button" className="linkbtn small" onClick={() => { if (!confirm("Delete this payment?")) return; api("deletePay", { id: r.id, alsoTx: r.txId ? confirm("Also remove it from Money out?") : false }, "Deleted."); }}>Delete</button></td></tr>
                ))}</tbody>
              </table>
            </details>
          )}
        </section>
      )}

      {contractors.length > 0 && (
        <section className="card stack" style={{ gap: 8 }}>
          <h3 style={{ margin: 0 }}>Contractors and 1099s for {year}</h3>
          <p className="small muted" style={{ margin: 0 }}>For payments made in 2026, a 1099-NEC is generally required once you pay a contractor {money0(threshold)} or more in the year (it was $600 before). From 2027 the IRS adjusts this amount for inflation, so confirm it each year.</p>
          {contractors.map((x) => {
            const paid = ytd(x.id), over = paid >= threshold;
            return (
              <div key={x.id} className="row between small" style={{ borderTop: "1px solid var(--line)", paddingTop: 8, gap: 10, flexWrap: "wrap" }}>
                <span><strong>{x.name}</strong> · {money0(paid)} paid</span>
                <span className="row" style={{ gap: 8 }}>
                  {over ? <span className="tag gold">1099-NEC needed</span> : <span className="tiny muted">{money0(r2(threshold - paid))} under the line</span>}
                  {!hasDoc(x, "w9") && <span className="tag rust">No W-9 on file</span>}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <section className="card stack" style={{ gap: 8 }}>
        <div className="row between" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Employer deadlines</h3>
          <span className="row" style={{ gap: 6 }}><button type="button" className="btn btn-sm btn-ghost" aria-label="Previous year" onClick={() => setYr(yr - 1)}>&larr;</button><strong>{yr}</strong><button type="button" className="btn btn-sm btn-ghost" aria-label="Next year" onClick={() => setYr(yr + 1)}>&rarr;</button></span>
        </div>
        <p className="small muted" style={{ margin: 0 }}>If you use a payroll provider, they usually file and deposit these for you. Check them off once you have confirmed they were done.</p>
        {employerDates(yr).filter((d) => (d.who === "contractors" ? contractors.length > 0 : s.people.some((x) => x.kind === "employee"))).map((d) => (
          <label key={d.key} className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap", borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            <input type="checkbox" style={{ width: "auto", marginTop: 4 }} checked={filed(d.key)} onChange={(e) => { const f = { ...s.filings }; if (e.target.checked) f[d.key] = today; else delete f[d.key]; flip(`f:${d.key}`, e.target.checked, save({ filings: f }, "Saved.")); }} />
            <span><strong>{d.label}</strong><br /><span className="tiny muted">Due {day(d.due)}{s.filings[d.key] ? ` · done ${day(s.filings[d.key])}` : d.due < today ? " · past due" : ""}</span></span>
          </label>
        ))}
        {s.people.length === 0 && <p className="small muted" style={{ margin: 0 }}>Add a team member to see the dates that apply to you.</p>}
        <p className="tiny muted" style={{ margin: 0 }}>Payroll tax deposits are separate from these filings: monthly (by the 15th of the next month) or semiweekly, depending on how much you withhold. Your state has its own withholding and unemployment filings too.</p>
      </section>

      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Records to keep, and for how long</summary>
        <ul className="small" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
          <li>Payroll and employment tax records: at least 4 years after the tax is due or paid (IRS).</li>
          <li>For hourly staff: hours worked each day and week, pay rate, overtime, and what was paid each period: at least 3 years (Department of Labor).</li>
          <li>Form I-9: 3 years after hire or 1 year after they leave, whichever is later. Store I-9s separately from other files.</li>
          <li>Form W-4: at least 4 years after the last return that used it.</li>
          <li>Contractor W-9s and the 1099s you send.</li>
        </ul>
      </details>
    </div>
  );
}

/* ---------------- The step-by-step guide ---------------- */
const RESOURCES: { title: string; url: string; what: string; who?: string }[] = [
  { title: "IRS Small Business and Self-Employed Tax Center", url: "https://www.irs.gov/businesses/small-businesses-self-employed", what: "The official starting point for business taxes, forms, and deadlines." },
  { title: "IRS Publication 583: Starting a Business and Keeping Records", url: "https://www.irs.gov/publications/p583", what: "What records to keep, how to organize them, and for how long." },
  { title: "IRS Form 1040-ES: Estimated Tax", url: "https://www.irs.gov/forms-pubs/about-form-1040-es", what: "How quarterly estimated taxes work, with a worksheet to figure the amount." },
  { title: "U.S. Small Business Administration: Manage your finances", url: "https://www.sba.gov/business-guide/manage-your-business/manage-your-finances", what: "Plain guides to cash flow, bookkeeping, and financial statements." },
  { title: "SCORE: free business mentoring", url: "https://www.score.org/find-mentor", what: "Free one-on-one mentoring, including with retired accountants and finance pros." },
  { title: "IRS Employment Tax Due Dates", url: "https://www.irs.gov/businesses/small-businesses-self-employed/employment-tax-due-dates", what: "Every payroll tax filing and deposit date, in one place.", who: "If you have staff" },
  { title: "IRS Publication 15 (Circular E): Employer's Tax Guide", url: "https://www.irs.gov/publications/p15", what: "The employer's handbook for withholding, deposits, and filing.", who: "If you have staff" },
  { title: "U.S. Department of Labor: Fair Labor Standards Act", url: "https://www.dol.gov/agencies/whd/flsa", what: "Minimum wage, overtime, and the records you must keep for hourly staff.", who: "If you have staff" },
  { title: "IRS Form 1099-NEC", url: "https://www.irs.gov/forms-pubs/about-form-1099-nec", what: "When and how to report what you paid contractors.", who: "If you pay contractors" },
  { title: "Profit First, by Mike Michalowicz", url: "https://mikemichalowicz.com/profit-first/", what: "The book behind the bucket method used here. Worth reading if the buckets click for you." },
];
const STEPS: { when: string; time: string; steps: { title: string; body: string; tab?: Tab }[] }[] = [
  { when: "Once, to get set up", time: "About 20 minutes", steps: [
    { title: "Open a separate business bank account", body: "If business and personal money share an account, start here. It is the single biggest thing that makes bookkeeping easy." },
    { title: "Set your buckets", body: "On Set up, keep the starting split (Profit 5%, Owner's pay 50%, Taxes 15%, Operating expenses 30%) or adjust it. Enter what you already have saved in each one.", tab: "setup" },
    { title: "Check your categories", body: "Also on Set up. Rename or add categories so they match how you think about your business. If you have an accountant, ask them for their list.", tab: "setup" },
    { title: "Bring in this month", body: "On Transactions, download a CSV file from your bank's website and import it, or add a few transactions by hand.", tab: "tx" },
    { title: "Add your team, if you have one", body: "On Team, add employees and contractors, then record each payroll or contractor payment as it happens.", tab: "team" },
  ] },
  { when: "Every week", time: "About 10 minutes", steps: [
    { title: "Add what came in and went out", body: "Import from your bank or add by hand. Give each transaction a category.", tab: "tx" },
    { title: "Attach receipts", body: "Snap a photo of each business receipt and add it to the transaction, so you are never hunting at tax time.", tab: "tx" },
    { title: "Split your income", body: "Drag each deposit into your buckets, or click Split it all by my percentages. Drag each payment onto the bucket it came from.", tab: "split" },
  ] },
  { when: "Twice a month", time: "5 minutes", steps: [
    { title: "Move the real money", body: "On the 10th and 25th, move money between your actual bank accounts so they match your buckets. Many owners keep a separate savings account for Profit and for Taxes." },
    { title: "Check invoices and bills", body: "Follow up on anything owed to you and pay what is due. Mark each one paid when it clears.", tab: "owed" },
  ] },
  { when: "Every month", time: "About 30 minutes", steps: [
    { title: "Run the month-end checklist", body: "Make sure your totals match your bank statement, everything is categorized, and every dollar is split.", tab: "close" },
    { title: "Look at your budget", body: "Compare what you planned with what happened, and adjust next month's plan.", tab: "budget" },
    { title: "Send your report", body: "On Reports, download your profit and loss and transactions and send them to your bookkeeper or accountant.", tab: "reports" },
  ] },
  { when: "Every quarter", time: "15 minutes", steps: [
    { title: "Pay estimated taxes", body: "Before each due date, ask your tax professional how much to pay, pay it from your Taxes bucket, and record it on Taxes.", tab: "taxes" },
    { title: "Nudge your percentages", body: "If it is working, move Profit up 1 or 2 points and take it from Operating expenses. Small steps stick." },
  ] },
];
export function Guide({ go }: { go: (t: Tab) => void }) {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0 }}>How Money works</h3>
        <p style={{ margin: 0 }}>Every dollar that comes in gets a job. You split income into buckets (profit, your pay, taxes, and running the business), and pay each bill from the right bucket. You always know what is safe to spend, what is set aside for taxes, and how the month really went.</p>
        <p className="small muted" style={{ margin: 0 }}>Your Money is private unless you choose to share it. Use Sharing settings at the top of this page to let Build &amp; Bloom review it with you, for as long as you want.</p>
      </section>
      {STEPS.map((g) => (
        <section key={g.when} className="card stack" style={{ gap: 4 }}>
          <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>{g.when}</h3><span className="tiny muted">{g.time}</span></div>
          <ol className="fin-guide">
            {g.steps.map((st) => (
              <li key={st.title}>
                <strong>{st.title}</strong>
                <span className="small">{st.body}</span>
                {st.tab && <button type="button" className="linkbtn small" onClick={() => go(st.tab!)}>Take me there &rarr;</button>}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <section className="card stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0 }}>Trusted, free resources</h3>
        {RESOURCES.map((r) => (
          <div key={r.url} className="stack" style={{ gap: 2, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <a href={r.url} target="_blank" rel="noopener noreferrer"><strong>{r.title}</strong></a>
            <span className="small">{r.what}{r.who ? <span className="muted"> · {r.who}</span> : null}</span>
          </div>
        ))}
        <p className="tiny muted" style={{ margin: "6px 0 0" }}>Also look up your state&rsquo;s department of revenue and labor department for state taxes, withholding, and unemployment insurance.</p>
      </section>
    </div>
  );
}
