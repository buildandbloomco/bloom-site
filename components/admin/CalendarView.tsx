"use client";

import { useMemo, useState } from "react";
import type { CalItem } from "@/lib/calendar";
import { shortDate } from "@/lib/format";

const KIND: Record<CalItem["kind"], { label: string; cls: string }> = {
  session: { label: "1:1 session", cls: "k-session" },
  consult: { label: "Consult", cls: "k-session" },
  event: { label: "Event", cls: "k-event" },
  other: { label: "Appointment", cls: "k-event" },
  class: { label: "Class", cls: "k-class" },
  milestone: { label: "Milestone due", cls: "k-due" },
  deliverable: { label: "Deliverable due", cls: "k-due" },
  workshop: { label: "Workshop", cls: "k-class" },
  payment: { label: "Payment due", cls: "k-pay" },
};
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const t12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}${m ? `:${pad(m)}` : ""}${h < 12 ? "a" : "p"}`;
};

interface Props {
  items: CalItem[];
  enrollments: { id: string; label: string }[];
  clients: { id: string; name: string }[];
  requests: { id: string; times: string; note: string; enrollmentId: string; name: string }[];
  prefill: { enrollmentId: string; requestId: string };
  bookingOn: boolean;
  feedUrl: string;
}

export default function CalendarView({ items: initial, enrollments, clients, requests: initialRequests, prefill, feedUrl, bookingOn }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const today = iso(new Date());
  const [items, setItems] = useState(initial);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<CalItem | null>(null);
  const blank = { title: "", date: today, start: "10:00", end: "11:00", kind: "session", clientId: "", enrollmentId: "", location: "", link: "", notes: "", countsAsSession: true, requestId: "", blocksDay: false };
  const [form, setForm] = useState(() => {
    if (!prefill.enrollmentId) return null;
    const req = requests.find((r) => r.id === prefill.requestId);
    return { ...blank, enrollmentId: prefill.enrollmentId, title: `1:1 session${req ? ` with ${req.name}` : ""}`, notes: req ? `Requested times: ${req.times}${req.note ? `\nFocus: ${req.note}` : ""}` : "", requestId: prefill.requestId };
  });
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const cells = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const byDate = useMemo(() => {
    const m: Record<string, CalItem[]> = {};
    for (const it of items) (m[it.date] ??= []).push(it);
    return m;
  }, [items]);
  const upcoming = items.filter((i) => i.date >= today).slice(0, 12);
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMsg("");
    const res = await fetch("/api/admin/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const a = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(a.error || "Could not save.");
    setItems((prev) => [...prev, { id: `a-${a.id}`, date: a.date, start: a.start, end: a.end, title: a.title, kind: a.kind, detail: [a.location, a.notes].filter(Boolean).join(" · "), href: "", apptId: a.id, link: a.link }].sort((x, y) => (x.date + (x.start || "00")).localeCompare(y.date + (y.start || "00"))));
    if (form.requestId) setRequests((prev) => prev.filter((r) => r.id !== form.requestId));
    setForm(null);
    setMsg("Added to your calendar.");
  }

  async function remove(it: CalItem) {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/admin/appointments/${it.apptId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    setSelected(null);
  }

  const Chip = ({ it }: { it: CalItem }) => (
    <button type="button" className={`cal-chip ${KIND[it.kind].cls}`} onClick={() => setSelected(it)} title={it.title}>
      {it.start && <span className="t">{t12(it.start)}</span>} {it.title}
    </button>
  );

  return (
    <div className="editor-grid">
      <div className="stack" style={{ gap: 14 }}>
        <div className="row between">
          <div className="row">
            <button type="button" className="btn btn-sm btn-ghost" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
            <strong style={{ fontFamily: "var(--display)", color: "var(--rust)", fontSize: "1.3rem", minWidth: 190, textAlign: "center" }}>{monthLabel}</strong>
            <button type="button" className="btn btn-sm btn-ghost" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
            <button type="button" className="linkbtn small" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</button>
          </div>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => { setForm({ ...blank, countsAsSession: false }); setSelected(null); }}>+ Add appointment</button>
        </div>

        <div className="cal-grid" role="grid" aria-label={monthLabel}>
          {DAYS.map((d) => <div key={d} className="cal-head" role="columnheader">{d}</div>)}
          {cells.map((d) => {
            const k = iso(d);
            const list = byDate[k] ?? [];
            return (
              <div key={k} role="gridcell" className={`cal-cell ${d.getMonth() !== month.getMonth() ? "out" : ""} ${k === today ? "today" : ""}`}>
                <button type="button" className="cal-day" onClick={() => { setForm({ ...blank, date: k, countsAsSession: false }); setSelected(null); }} aria-label={`Add on ${shortDate(k)}`}>{d.getDate()}</button>
                {list.slice(0, 3).map((it) => <Chip key={it.id} it={it} />)}
                {list.length > 3 && <span className="tiny muted">+{list.length - 3} more</span>}
              </div>
            );
          })}
        </div>

        <div className="cal-agenda">
          <h3>This month</h3>
          {items.filter((i) => i.date.slice(0, 7) === iso(month).slice(0, 7)).map((it) => (
            <div key={it.id} className="row" style={{ flexWrap: "nowrap", borderTop: "1px solid var(--line)", paddingTop: 8 }}>
              <span className="small" style={{ width: 90, flexShrink: 0 }}>{shortDate(it.date).replace(/, \d{4}$/, "")}{it.start ? ` ${t12(it.start)}` : ""}</span>
              <Chip it={it} />
            </div>
          ))}
        </div>

        <div className="row small" style={{ gap: 14 }}>
          {[["k-session", "Sessions & consults"], ["k-class", "Classes & workshops"], ["k-event", "Events"], ["k-due", "Client deadlines"], ["k-pay", "Payments due"]].map(([c, l]) => (
            <span key={c} className="row" style={{ gap: 6 }}><span className={`cal-dot ${c}`} aria-hidden="true" />{l}</span>
          ))}
        </div>
      </div>

      <div className="sticky-col">
        {form && (
          <form className="panel" onSubmit={save}>
            <h3>New appointment</h3>
            <label>Title<input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kickoff with Jordan" /></label>
            <div className="grid-3" style={{ gap: 8, gridTemplateColumns: "1.3fr 1fr 1fr" }}>
              <label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
              <label>Start<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
              <label>End<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
            </div>
            <label>
              Type
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="session">1:1 session</option>
                <option value="consult">Consult</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </label>
            {form.kind === "other" && (
              <label className="checks" style={{ flexDirection: "row", gap: 8, fontWeight: 400 }}>
                <input type="checkbox" checked={form.blocksDay} onChange={() => setForm({ ...form, blocksDay: !form.blocksDay })} /> Day off: nobody can book this day
              </label>
            )}
            <label>
              Course learner <span className="hint">optional</span>
              <select value={form.enrollmentId} onChange={(e) => setForm({ ...form, enrollmentId: e.target.value, countsAsSession: !!e.target.value })}>
                <option value="">None</option>
                {enrollments.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </label>
            {form.enrollmentId ? (
              <label className="checks" style={{ flexDirection: "row", gap: 8, fontWeight: 400 }}>
                <input type="checkbox" checked={form.countsAsSession} onChange={() => setForm({ ...form, countsAsSession: !form.countsAsSession })} /> Counts as one of their included sessions
              </label>
            ) : (
              <label>
                Client <span className="hint">optional</span>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                  <option value="">None</option>
                  {clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
            )}
            <label>Meeting link<input type="url" placeholder="https://zoom.us/..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></label>
            <label>Location<input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="row">
              <button className="btn btn-sm btn-primary">Save</button>
              <button type="button" className="linkbtn small" onClick={() => setForm(null)}>Cancel</button>
            </div>
            {form.enrollmentId && <p className="tiny muted">It shows on their course page with an &ldquo;Add to my calendar&rdquo; link.</p>}
          </form>
        )}
        {msg && <p className="ok-text small" role="status">{msg}</p>}

        {selected && !form && (
          <section className="panel">
            <span className={`tag ${KIND[selected.kind].cls}`}>{KIND[selected.kind].label}</span>
            <h3 style={{ textTransform: "none", letterSpacing: 0, fontSize: "1.2rem", color: "var(--rust)" }}>{selected.title}</h3>
            <p className="small">{shortDate(selected.date)}{selected.start ? ` · ${t12(selected.start)}${selected.end ? ` to ${t12(selected.end)}` : ""} ET` : ""}</p>
            {selected.detail && <p className="small muted" style={{ whiteSpace: "pre-line" }}>{selected.detail}</p>}
            <div className="row">
              {selected.link && <a className="btn btn-sm btn-dark" href={selected.link} target="_blank" rel="noopener noreferrer">Open link</a>}
              {selected.href && <a className="btn btn-sm btn-ghost" href={selected.href}>Open</a>}
              {selected.apptId && <button type="button" className="linkbtn danger small" onClick={() => remove(selected)}>Delete</button>}
            </div>
          </section>
        )}

        {requests.length > 0 && (
          <section className="panel">
            <h3>Session requests</h3>
            {requests.map((r) => (
              <div key={r.id} className="stack" style={{ gap: 4, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                <strong className="small">{r.name}</strong>
                <span className="small">{r.times}</span>
                {r.note && <span className="small muted">“{r.note}”</span>}
                <button type="button" className="btn btn-sm btn-dark" style={{ alignSelf: "flex-start" }} onClick={() => { setSelected(null); setForm({ ...blank, enrollmentId: r.enrollmentId, title: `1:1 session with ${r.name}`, notes: `Requested times: ${r.times}${r.note ? `\nFocus: ${r.note}` : ""}`, requestId: r.id }); }}>Schedule</button>
              </div>
            ))}
          </section>
        )}

        <section className="panel">
          <h3>Online booking</h3>
          <p className="small muted" style={{ margin: 0 }}>{bookingOn ? "People book open times on your booking page. Bookings land here automatically." : "Built-in booking is off. Your Book buttons use your outside link."}</p>
          <div className="row">
            <a className="btn btn-sm btn-ghost" href="/admin/settings#booking">Set my hours</a>
            {bookingOn && <a className="linkbtn small" href="/book" target="_blank" rel="noopener noreferrer">View booking page ↗</a>}
          </div>
        </section>

        <section className="panel">
          <h3>Coming up</h3>
          {!upcoming.length && <p className="small muted">Nothing scheduled yet.</p>}
          {upcoming.map((it) => (
            <button key={it.id} type="button" className="up-item" onClick={() => setSelected(it)}>
              <span className={`cal-dot ${KIND[it.kind].cls}`} aria-hidden="true" />
              <span className="stack" style={{ gap: 0, textAlign: "left" }}>
                <span className="small">{it.title}</span>
                <span className="tiny muted">{shortDate(it.date)}{it.start ? ` · ${t12(it.start)}` : ""}</span>
              </span>
            </button>
          ))}
        </section>

        <section className="panel">
          <h3>See it on your phone</h3>
          <p className="small muted">Subscribe in Google Calendar (Other calendars &gt; From URL), Apple Calendar, or Outlook. Keep this link private.</p>
          <button type="button" className="btn btn-sm btn-ghost" onClick={async () => { await navigator.clipboard.writeText(feedUrl); setCopied(true); }}>{copied ? "Copied" : "Copy calendar link"}</button>
        </section>
      </div>
    </div>
  );
}
