"use client";

import { useState } from "react";
import { usd, type EventTier } from "@/lib/event-def";

type Ev = { slug: string; name: string; endsAt: string; intro: string; tiers: EventTier[]; active?: boolean; code: string; open?: boolean; headline?: string; details?: string };
type Svc = { id: string; name: string; price: number | null };

const TZ = "America/New_York";
/** ISO -> "YYYY-MM-DDTHH:mm" in Eastern time, for a datetime-local field */
function toET(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
/** Eastern "YYYY-MM-DDTHH:mm" -> ISO, handling daylight saving */
function fromET(local: string) {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return "";
  const base = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  for (const off of [4, 5]) { const iso = new Date(base + off * 3600e3).toISOString(); if (toET(iso) === local.slice(0, 16)) return iso; }
  return new Date(base + 5 * 3600e3).toISOString();
}
const lines = (a: string[]) => a.join("\n");
const split = (s: string) => s.split("\n");
const blankTier = (n: number): EventTier => ({ id: `offer-${n}-${Math.random().toString(36).slice(2, 6)}`, name: "", tagline: "", price: 0, includes: [], serviceIds: [], agreement: true, next: ["Sign your service agreement at the top of your portal.", "Book your first session from your portal."], active: true });

export default function EventsEditor({ initial, services, origin }: { initial: Ev[]; services: Svc[]; origin: string }) {
  const [events, setEvents] = useState<Ev[]>(initial);
  const [saved, setSaved] = useState<Ev[]>(initial);
  const [open, setOpen] = useState(initial[0]?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = JSON.stringify(events) !== JSON.stringify(saved);

  const upd = (i: number, p: Partial<Ev>) => setEvents(events.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const updTier = (i: number, k: number, p: Partial<EventTier>) => upd(i, { tiers: events[i].tiers.map((t, j) => (j === k ? { ...t, ...p } : t)) });
  const moveTier = (i: number, k: number, d: number) => { const t = [...events[i].tiers]; const [x] = t.splice(k, 1); t.splice(k + d, 0, x); upd(i, { tiers: t }); };

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(d.error || "Could not save."); return; }
    setEvents(d.events); setSaved(d.events); setMsg("Saved. Guests see the changes right away.");
  }
  function addEvent() {
    const end = new Date(Date.now() + 7 * 864e5); end.setUTCHours(3, 59, 0, 0);
    const n: Ev = { slug: `event-${events.length + 1}`, name: "New event", endsAt: end.toISOString(), intro: "These offers are for the people in this room, for a short time only.", tiers: [blankTier(1)], active: false, code: "BLOOM" };
    setEvents([...events, n]); setOpen(n.slug);
  }
  function duplicate(i: number) {
    const e = events[i];
    const n: Ev = { ...e, slug: `${e.slug}-copy`, name: `${e.name} (copy)`, active: false, tiers: e.tiers.map((t) => ({ ...t, includes: [...t.includes], next: [...t.next], serviceIds: [...t.serviceIds] })) };
    setEvents([...events, n]); setOpen(n.slug);
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      {events.map((e, i) => {
        const closed = new Date(e.endsAt).getTime() <= Date.now();
        const status = e.active === false ? "Off" : closed ? "Closed" : "Open";
        const isSaved = saved.some((s) => s.slug === e.slug);
        const url = `${origin}/event/${e.slug}`;
        return (
          <section key={i} className="card stack" style={{ gap: 14 }}>
            <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="linkbtn" style={{ fontSize: "1.3rem", fontWeight: 600, textDecoration: "none" }} aria-expanded={open === e.slug} onClick={() => setOpen(open === e.slug ? "" : e.slug)}>
                {open === e.slug ? "▾" : "▸"} {e.name || "Untitled event"}
              </button>
              <span className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className={`tag ${status === "Open" ? "green" : status === "Off" ? "" : "rust"}`}>{status}</span>
                {isSaved && <a className="btn btn-sm btn-ghost" href={`/event/${e.slug}`} target="_blank" rel="noopener noreferrer">Open page ↗</a>}
                {isSaved && <a className="btn btn-sm btn-ghost" href={`/admin/card/${e.slug}`} target="_blank" rel="noopener noreferrer">Print card ↗</a>}
              </span>
            </div>
            {open === e.slug && (
              <div className="stack" style={{ gap: 14 }}>
                <p className="small muted" style={{ margin: 0 }}>Guest link: <code>{url}</code>{isSaved ? "" : " (save first)"}</p>
                <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <label>Event name<input type="text" value={e.name} onChange={(x) => upd(i, { name: x.target.value })} /></label>
                  <label>Web address <span className="hint">/event/…</span><input type="text" value={e.slug} onChange={(x) => upd(i, { slug: x.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></label>
                  <label>Closes (Eastern time)<input type="datetime-local" value={toET(e.endsAt)} onChange={(x) => upd(i, { endsAt: fromET(x.target.value) || e.endsAt })} /></label>
                  <label>Room code <span className="hint">Say it out loud</span><input type="text" value={e.code} onChange={(x) => upd(i, { code: x.target.value.toUpperCase() })} /></label>
                </div>
                <p className="tiny muted" style={{ margin: 0 }}>Changing the web address breaks QR codes you already printed. Changing the room code asks everyone to enter the new one.</p>
                <label>Welcome text<textarea rows={3} value={e.intro} onChange={(x) => upd(i, { intro: x.target.value })} /></label>
                <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={e.active !== false} onChange={(x) => upd(i, { active: x.target.checked })} />Show this page to guests (off = it shows as closed)</label>
                <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={!!e.open} onChange={(x) => upd(i, { open: x.target.checked })} />Open to the public: no room code, listed on your Workshops page (for workshops and public events)</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  <label>Headline <span className="hint">Blank = &ldquo;Leave empowered, with a next step.&rdquo;</span><input type="text" value={e.headline || ""} onChange={(x) => upd(i, { headline: x.target.value })} /></label>
                  <label>When and where <span className="hint">e.g. Sat, Nov 14 · 11 AM ET · On Zoom</span><input type="text" value={e.details || ""} onChange={(x) => upd(i, { details: x.target.value })} /></label>
                </div>

                <h3 style={{ margin: "8px 0 0" }}>Offers</h3>
                {e.tiers.map((t, k) => (
                  <div key={t.id} className="stack" style={{ gap: 10, border: "1px solid var(--line)", borderRadius: 14, padding: 14, background: t.active === false ? "var(--cream)" : "transparent" }}>
                    <div className="row between" style={{ gap: 8, flexWrap: "wrap" }}>
                      <strong>{t.name || `Offer ${k + 1}`}{t.early ? ` · ${usd(t.early.price)}, then` : ""}{t.price ? ` · ${usd(t.price)}` : ""}</strong>
                      <span className="row" style={{ gap: 8 }}>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={k === 0} aria-label="Move up" onClick={() => moveTier(i, k, -1)}>↑</button>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={k === e.tiers.length - 1} aria-label="Move down" onClick={() => moveTier(i, k, 1)}>↓</button>
                        <button type="button" className="linkbtn small" onClick={() => confirm(`Remove ${t.name || "this offer"}?`) && upd(i, { tiers: e.tiers.filter((_, j) => j !== k) })}>Remove</button>
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                      <label>Name<input type="text" value={t.name} onChange={(x) => updTier(i, k, { name: x.target.value })} /></label>
                      <label>Event price<input type="number" min={0} step="1" value={t.price || ""} onChange={(x) => updTier(i, k, { price: Number(x.target.value) })} /></label>
                      <label>Usually <span className="hint">Crossed out</span><input type="number" min={0} step="1" value={t.was || ""} onChange={(x) => updTier(i, k, { was: Number(x.target.value) || undefined })} /></label>
                      <label>Decide-today price <span className="hint">Blank = none</span><input type="number" min={0} step="1" value={t.early?.price || ""} onChange={(x) => updTier(i, k, { early: Number(x.target.value) ? { price: Number(x.target.value), until: t.early?.until || e.endsAt } : undefined })} /></label>
                      {t.early ? <label>Decide-today ends (Eastern)<input type="datetime-local" value={toET(t.early.until)} onChange={(x) => updTier(i, k, { early: { price: t.early!.price, until: fromET(x.target.value) || t.early!.until } })} /></label> : null}
                      <label>Deposit option <span className="hint">Blank = none</span><input type="number" min={0} step="1" value={t.deposit || ""} onChange={(x) => updTier(i, k, { deposit: Number(x.target.value) || undefined })} /></label>
                    </div>
                    <label>One line under the name<input type="text" value={t.tagline} onChange={(x) => updTier(i, k, { tagline: x.target.value })} /></label>
                    {t.deposit ? <label>Deposit note<input type="text" value={t.depositNote || ""} onChange={(x) => updTier(i, k, { depositNote: x.target.value })} placeholder="The balance is due before your first session, in your portal." /></label> : null}
                    <label>What's included <span className="hint">One per line</span><textarea rows={4} value={lines(t.includes)} onChange={(x) => updTier(i, k, { includes: split(x.target.value) })} /></label>
                    <label>What happens after they pay <span className="hint">One per line, shown on their welcome page</span><textarea rows={3} value={lines(t.next)} onChange={(x) => updTier(i, k, { next: split(x.target.value) })} /></label>
                    <details>
                      <summary className="small" style={{ cursor: "pointer" }}>Services this becomes in their portal and agreement ({t.serviceIds.length})</summary>
                      <div className="stack" style={{ gap: 4, marginTop: 8, maxHeight: 220, overflow: "auto" }}>
                        {services.map((s) => (
                          <label key={s.id} className="row small" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={t.serviceIds.includes(s.id)} onChange={(x) => updTier(i, k, { serviceIds: x.target.checked ? [...t.serviceIds, s.id] : t.serviceIds.filter((y) => y !== s.id) })} />{s.name}{s.price ? <span className="muted"> · usually {usd(s.price)}</span> : null}</label>
                        ))}
                      </div>
                    </details>
                    <div className="row small" style={{ gap: 16, flexWrap: "wrap" }}>
                      <label className="row" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={t.active !== false} onChange={(x) => updTier(i, k, { active: x.target.checked })} />Show to guests</label>
                      <label className="row" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={!!t.featured} onChange={(x) => updTier(i, k, { featured: x.target.checked })} />Highlight as "Most support"</label>
                      <label className="row" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={t.agreement} onChange={(x) => updTier(i, k, { agreement: x.target.checked })} />Needs a signed agreement</label>
                      <label className="row" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={!!t.fromPrice} onChange={(x) => updTier(i, k, { fromPrice: x.target.checked })} />Show as &ldquo;From&rdquo; price</label>
                      {t.deposit ? <label className="row" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={!!t.depositOnly} onChange={(x) => updTier(i, k, { depositOnly: x.target.checked })} />Reserve with deposit only</label> : null}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      <label>Limited spots <span className="hint">Blank = unlimited</span><input type="number" min={0} step="1" value={t.spots || ""} onChange={(x) => updTier(i, k, { spots: Number(x.target.value) || undefined })} /></label>
                      {t.spots ? <label>Spot group <span className="hint">Offers with the same group share spots, across events</span><input type="text" value={t.pool || ""} onChange={(x) => updTier(i, k, { pool: x.target.value })} /></label> : null}
                      <label>Turns on a build workspace<select value={t.build || ""} onChange={(x) => updTier(i, k, { build: (x.target.value || undefined) as EventTier["build"] })}><option value="">No</option><option value="systems-landing">Landing page</option><option value="systems-portal">Proposal and payment portal</option><option value="systems-hub">Full operations hub</option></select></label>
                    </div>
                  </div>
                ))}
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => upd(i, { tiers: [...e.tiers, blankTier(e.tiers.length + 1)] })}>+ Add an offer</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => duplicate(i)}>Duplicate this event</button>
                  <button type="button" className="linkbtn small" onClick={() => confirm(`Delete ${e.name}? Its page stops working.`) && setEvents(events.filter((_, j) => j !== i))}>Delete event</button>
                </div>
              </div>
            )}
          </section>
        );
      })}
      <div><button type="button" className="btn btn-sm btn-ghost" onClick={addEvent}>+ New event</button></div>
      <div className="row" style={{ gap: 12, position: "sticky", bottom: 12, background: "var(--ivory)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 14px", boxShadow: "var(--shadow)", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
        <span className="small" role="status">{msg || (dirty ? "You have unsaved changes." : "All changes saved.")}</span>
      </div>
    </div>
  );
}
