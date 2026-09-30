"use client";

import { useState } from "react";
import type { Enrollment } from "@/lib/course-types";
import { money, shortDate } from "@/lib/format";

export default function EnrollmentAdmin({ e: initial, appts }: { e: Enrollment; appts: { id: string; title: string; date: string; start: string }[] }) {
  const [e, setE] = useState(initial);
  const [notes, setNotes] = useState(initial.notes);
  const [pay, setPay] = useState({ amount: "", method: "Zelle", note: "", date: new Date().toISOString().slice(0, 10) });
  const url = `/api/admin/enrollments/${e.id}`;

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) setE(await res.json());
  }

  return (
    <>
      <section className="panel">
        <h3>Status</h3>
        <select value={e.status} onChange={(x) => patch({ status: x.target.value })}>
          <option value="pending">Pending (no access yet)</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <label className="checks" style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={e.comped} onChange={() => patch({ comped: !e.comped })} /> Complimentary / scholarship
        </label>
      </section>

      <section className="panel">
        <h3>1:1 sessions</h3>
        <div className="row between">
          <span className="small">Included</span>
          <div className="row">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ sessionsIncluded: Math.max(0, e.sessionsIncluded - 1) })} aria-label="Fewer included">−</button>
            <strong>{e.sessionsIncluded}</strong>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ sessionsIncluded: e.sessionsIncluded + 1 })} aria-label="More included">+</button>
          </div>
        </div>
        <div className="row between">
          <span className="small">Used</span>
          <div className="row">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ sessionsUsed: Math.max(0, e.sessionsUsed - 1) })} aria-label="Fewer used">−</button>
            <strong>{e.sessionsUsed}</strong>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ sessionsUsed: e.sessionsUsed + 1 })} aria-label="More used">+</button>
          </div>
        </div>
        {appts.length > 0 && (
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {appts.map((a) => <li key={a.id}>{a.title} · {shortDate(a.date)} {a.start}</li>)}
          </ul>
        )}
        {e.requests.filter((r) => r.status === "new").map((r) => (
          <div key={r.id} className="banner warn" style={{ margin: 0 }}>
            <strong>Session request</strong> ({shortDate(r.date)})<br />
            <span className="small">Times: {r.times}</span>
            {r.note && <><br /><span className="small">“{r.note}”</span></>}
            <div className="row" style={{ marginTop: 8 }}>
              <a className="btn btn-sm btn-dark" href={`/admin/calendar?enrollment=${e.id}&request=${r.id}`}>Schedule it</a>
              <button type="button" className="linkbtn small" onClick={() => patch({ requestId: r.id, requestStatus: "closed" })}>Dismiss</button>
            </div>
          </div>
        ))}
        <a className="btn btn-sm btn-ghost" href={`/admin/calendar?enrollment=${e.id}`}>Schedule a session</a>
      </section>

      <section className="panel">
        <h3>Payments</h3>
        {e.payments.length === 0 && <p className="small muted">No payments yet.</p>}
        <ul className="lines small">
          {e.payments.map((p) => (
            <li key={p.id} style={{ flexDirection: "column", gap: 2 }}>
              <div className="row between"><strong>{money(p.amount)}</strong><span className="muted">{shortDate(p.date)}</span></div>
              <span className="muted">{p.method}{p.note ? ` · ${p.note}` : ""}</span>
              <button type="button" className="linkbtn danger tiny" style={{ alignSelf: "flex-start" }} onClick={async () => {
                if (!confirm("Remove this payment record?")) return;
                const res = await fetch(`${url}/payments?paymentId=${p.id}`, { method: "DELETE" });
                if (res.ok) setE(await res.json());
              }}>Remove</button>
            </li>
          ))}
        </ul>
        <details>
          <summary className="small" style={{ cursor: "pointer" }}>Record a payment</summary>
          <form className="stack" style={{ gap: 8, marginTop: 10 }} onSubmit={async (x) => {
            x.preventDefault();
            const res = await fetch(`${url}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pay) });
            if (res.ok) { setE(await res.json()); setPay({ ...pay, amount: "", note: "" }); }
          }}>
            <input type="number" min={0.01} step="0.01" placeholder="Amount" required value={pay.amount} onChange={(x) => setPay({ ...pay, amount: x.target.value })} />
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input type="date" value={pay.date} onChange={(x) => setPay({ ...pay, date: x.target.value })} />
              <select value={pay.method} onChange={(x) => setPay({ ...pay, method: x.target.value })}>
                {["Zelle", "Cash App", "Invoice", "Check", "Cash", "Other"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Note (optional)" value={pay.note} onChange={(x) => setPay({ ...pay, note: x.target.value })} />
            <button className="btn btn-sm btn-dark">Add payment</button>
          </form>
        </details>
      </section>

      <section className="panel">
        <h3>Private notes</h3>
        <textarea value={notes} onChange={(x) => setNotes(x.target.value)} onBlur={() => patch({ notes })} />
        <button type="button" className="linkbtn danger small" style={{ alignSelf: "flex-start" }} onClick={async () => {
          if (!confirm("Remove this learner from the course? Their answers will be deleted.")) return;
          await fetch(url, { method: "DELETE" });
          window.location.href = `/admin/courses/${e.courseId}?tab=learners`;
        }}>Remove from course</button>
      </section>
    </>
  );
}
