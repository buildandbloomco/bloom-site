"use client";
import "./availability.css";

import { useState } from "react";
import type { BookingSettings, Settings } from "@/lib/types";
import { DAY_NAMES } from "@/lib/booking";

export default function SettingsEditor({ initial, status }: { initial: Settings; status: { stripe: boolean; webhook: boolean; db: boolean } }) {
  const [s, setS] = useState<Settings>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((p) => ({ ...p, [k]: v }));
    setDirty(true);
    setMsg("");
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(data.error || "Could not save.");
    setS(data);
    setDirty(false);
    setMsg("Saved");
  }

  const text = (k: keyof Settings, label: string, hint?: string, type = "text") => (
    <label>
      {label} {hint && <span className="hint">{hint}</span>}
      <input type={type} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
    </label>
  );

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 820 }}>
      <section className="panel">
        <h3>Setup check</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>{status.db ? "✓ Database connected" : "• Using local test storage (connect Upstash Redis on Vercel)"}</li>
          <li>{status.stripe ? "✓ Stripe connected: clients can pay online" : "• Stripe not connected yet: add STRIPE_SECRET_KEY"}</li>
          <li>{status.webhook ? "✓ Stripe webhook set" : "• Optional: add STRIPE_WEBHOOK_SECRET so payments always record, even if a client closes the tab"}</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Brand & contact</h3>
        <div className="grid-2" style={{ gap: 14 }}>
          {text("brandName", "Business name")}
          {text("location", "Location")}
          {text("email", "Email", undefined, "email")}
          {text("phone", "Phone", "optional")}
          {text("website", "Website", undefined, "url")}
          {text("instagram", "Instagram link", undefined, "url")}
        </div>
        {text("tagline", "Tagline")}
      </section>

      <BookingSection b={s.booking} setB={(fn) => { const next = structuredClone(s.booking); fn(next); set("booking", next); }} />

      <section className="panel">
        <h3>Outside booking link</h3>
        <p className="small muted">Only used if you turn off built-in booking above.</p>
        {text("bookingUrl", "Booking link", "Calendly, Acuity...", "url")}
      </section>

      <section className="panel">
        <h3>Zelle payments</h3>
        <p className="small muted">Clients can choose Zelle instead of card in their portal. They see where to send it, tell you when they have sent it, and you confirm once it arrives. Leave the first box empty to turn Zelle off.</p>
        <div className="grid-2" style={{ gap: 14 }}>
          <label>Send Zelle to <span className="hint">phone or email</span><input type="text" value={s.zelle ?? ""} onChange={(e) => set("zelle", e.target.value)} placeholder="404-555-0100" /></label>
          <label>Name on your Zelle <span className="hint">what they will see in their bank app</span><input type="text" value={s.zelleName ?? ""} onChange={(e) => set("zelleName", e.target.value)} placeholder="Build & Bloom Collective" /></label>
        </div>
      </section>

      <section className="panel">
        <h3>Defaults</h3>
        <label>
          “Before you book” notes <span className="hint">Shown next to the payment summary. One per line.</span>
          <textarea value={s.beforeYouBook.join("\n")} onChange={(e) => set("beforeYouBook", e.target.value.split("\n"))} />
        </label>
        <label>
          Default next steps for new clients <span className="hint">One per line</span>
          <textarea style={{ minHeight: 140 }} value={s.defaultNextSteps.join("\n")} onChange={(e) => set("defaultNextSteps", e.target.value.split("\n"))} />
        </label>
      </section>

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>Save changes</button>}
        </div>
      )}
    </div>
  );
}

function BookingSection({ b, setB }: { b: BookingSettings; setB: (fn: (d: BookingSettings) => void) => void }) {
  const [newDate, setNewDate] = useState("");
  const num = (k: "consultMinutes" | "sessionMinutes" | "bufferMinutes" | "noticeHours" | "daysAhead" | "maxPerDay", label: string, hint?: string) => (
    <label>
      {label} {hint && <span className="hint">{hint}</span>}
      <input type="number" min={0} value={b[k]} onChange={(e) => setB((d) => void (d[k] = Number(e.target.value)))} />
    </label>
  );
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <section className="panel" id="booking">
      <h3>Booking &amp; availability</h3>
      <div className="checks">
        <label>
          <input type="checkbox" checked={b.enabled} onChange={() => setB((d) => void (d.enabled = !d.enabled))} />
          <span className="stack" style={{ gap: 2 }}>
            <span>Use my own booking page</span>
            <span className="hint">Every Book button on your website, portal, and courses opens /book. Bookings go straight onto your Calendar, and consults show up in Leads.</span>
          </span>
        </label>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="small" style={{ fontWeight: 600 }}>Weekly hours (Eastern Time)</span>
        {order.map((day) => {
          const blocks = b.hours.map((h, i) => ({ h, i })).filter((x) => x.h.day === day);
          return (
            <div key={day} className="avail-row">
              <label className="avail-day" style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 600 }}>
                <input type="checkbox" checked={blocks.length > 0} onChange={() => setB((d) => {
                  if (blocks.length) d.hours = d.hours.filter((h) => h.day !== day);
                  else d.hours.push({ day, start: "10:00", end: "16:00" });
                })} />
                {DAY_NAMES[day].slice(0, 3)}
              </label>
              <div className="stack" style={{ gap: 6 }}>
                {blocks.length === 0 && <span className="small muted">Unavailable</span>}
                {blocks.map(({ h, i }) => (
                  <div key={i} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <input type="time" aria-label={`${DAY_NAMES[day]} start`} value={h.start} onChange={(e) => setB((d) => void (d.hours[i].start = e.target.value))} style={{ width: 150 }} />
                    <span className="small">to</span>
                    <input type="time" aria-label={`${DAY_NAMES[day]} end`} value={h.end} onChange={(e) => setB((d) => void (d.hours[i].end = e.target.value))} style={{ width: 150 }} />
                    <button type="button" className="linkbtn danger tiny" onClick={() => setB((d) => void d.hours.splice(i, 1))}>Remove</button>
                  </div>
                ))}
                {blocks.length > 0 && (
                  <button type="button" className="linkbtn tiny" style={{ alignSelf: "flex-start" }} onClick={() => setB((d) => void d.hours.push({ day, start: "17:00", end: "19:00" }))}>+ Add hours</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid-3" style={{ gap: 14 }}>
        {num("consultMinutes", "Consult length", "minutes")}
        {num("sessionMinutes", "Client session length", "minutes; courses use their package length")}
        {num("bufferMinutes", "Break between bookings", "minutes")}
        {num("noticeHours", "Minimum notice", "hours")}
        {num("daysAhead", "Book up to", "days ahead")}
        {num("maxPerDay", "Most bookings per day", "0 = no limit")}
      </div>
      <div className="grid-2" style={{ gap: 14 }}>
        <label>Consult name<input type="text" value={b.consultTitle} onChange={(e) => setB((d) => void (d.consultTitle = e.target.value))} /></label>
        <label>Where <span className="hint">shown if there is no link</span><input type="text" value={b.location} onChange={(e) => setB((d) => void (d.location = e.target.value))} /></label>
      </div>
      <label>Meeting link <span className="hint">Your Zoom or Google Meet room. People see it right after they book.</span><input type="url" placeholder="https://zoom.us/j/..." value={b.meetingLink} onChange={(e) => setB((d) => void (d.meetingLink = e.target.value))} /></label>
      <label>Consult description<textarea value={b.consultIntro} onChange={(e) => setB((d) => void (d.consultIntro = e.target.value))} /></label>
      <div className="stack" style={{ gap: 8 }}>
        <span className="small" style={{ fontWeight: 600 }}>Days off <span className="hint">No one can book these dates</span></span>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {[...b.blockedDates].sort().map((d) => (
            <span key={d} className="tag">{d} <button type="button" className="linkbtn tiny" aria-label={`Remove ${d}`} onClick={() => setB((x) => void (x.blockedDates = x.blockedDates.filter((y) => y !== d)))}>×</button></span>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: 180 }} aria-label="Day off" />
          <button type="button" className="btn btn-sm btn-ghost" disabled={!newDate} onClick={() => { setB((x) => void (x.blockedDates = [...new Set([...x.blockedDates, newDate])])); setNewDate(""); }}>Add day off</button>
        </div>
      </div>
      <p className="small muted">Anything with a time on your Calendar (sessions, events, class dates) is blocked automatically. To block other commitments, add them to your Calendar.</p>
    </section>
  );
}
