"use client";

import "./content.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CONTENT_STATUSES, CONTENT_TYPES, contentTypeLabel, posterFor, type ContentPost, type ContentType } from "@/lib/content-types";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const mondayOf = (s: string) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const nice = (s: string, o: Intl.DateTimeFormatOptions) => parse(s).toLocaleDateString("en-US", o);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type View = "list" | "calendar" | "ideas";

function Thumb({ p }: { p: ContentPost }) {
  const m = p.media[0];
  if (!m) return <span className="ct-thumb empty">{p.type === "face" ? "You on camera" : "No media yet"}</span>;
  if (m.kind === "video") { const poster = posterFor(m.url); return poster ? <img className="ct-thumb" src={poster} alt="" loading="lazy" /> : <video className="ct-thumb" src={`${m.url}#t=1`} muted preload="metadata" playsInline aria-hidden="true" />; }
  return <img className="ct-thumb" src={m.url} alt="" loading="lazy" />;
}

export default function ContentBoard({ initial }: { initial: ContentPost[] }) {
  const [posts, setPosts] = useState(initial);
  const [view, setView] = useState<View>("list");
  const [only, setOnly] = useState<ContentType | "">("");
  const [showPosted, setShowPosted] = useState(false);
  const today = iso(new Date());
  const firstDated = posts.find((p) => p.date)?.date;
  const [month, setMonth] = useState(() => { const s = firstDated && firstDated > today ? firstDated : today; const d = parse(s); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [form, setForm] = useState<{ title: string; date: string; type: ContentType } | null>(null);
  const [shift, setShift] = useState<{ from: string; days: string } | null>(null);
  const [msg, setMsg] = useState("");

  const visible = posts.filter((p) => !only || p.type === only);
  const dated = visible.filter((p) => p.date);
  const ideas = visible.filter((p) => !p.date);
  const listItems = dated.filter((p) => showPosted || p.status !== "posted");
  const weeks = useMemo(() => {
    const m = new Map<string, ContentPost[]>();
    for (const p of listItems) { const k = mondayOf(p.date); m.set(k, [...(m.get(k) ?? []), p]); }
    return [...m.entries()];
  }, [listItems]);
  const cells = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - ((start.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);

  const counts = Object.fromEntries(CONTENT_STATUSES.map((s) => [s.id, posts.filter((p) => p.status === s.id).length]));
  const nextUp = posts.filter((p) => p.date && p.date >= today && p.status !== "posted" && p.type !== "face")[0];
  const openFace = posts.filter((p) => p.type === "face" && p.status !== "posted").length;

  async function setStatus(p: ContentPost, status: ContentPost["status"]) {
    const res = await fetch(`/api/admin/content/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { const d = await res.json(); setPosts((prev) => prev.map((x) => (x.id === d.id ? d : x))); }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const res = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(d.error || "Could not add it.");
    window.location.href = `/admin/content/${d.id}`;
  }

  async function doShift(e: React.FormEvent) {
    e.preventDefault();
    if (!shift) return;
    const res = await fetch("/api/admin/content/shift", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: shift.from, days: Number(shift.days) }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(d.error || "Could not move them.");
    setMsg(`Moved ${d.moved} post${d.moved === 1 ? "" : "s"}. Refreshing...`);
    window.location.reload();
  }

  const row = (p: ContentPost) => (
    <div key={p.id} className={`ct-row ct-type-${p.type}${p.status === "posted" ? " posted" : ""}`}>
      <div className="when">{p.date ? <><b>{nice(p.date, { weekday: "short" })}</b>{nice(p.date, { month: "short", day: "numeric" })}</> : <b>No date</b>}</div>
      <Thumb p={p} />
      <div className="t">
        <Link href={`/admin/content/${p.id}`}>{p.launch ? "★ " : ""}{p.title}</Link>
        <div className="meta">{contentTypeLabel(p.type)}{p.campaign ? ` · ${p.campaign}` : ""}{p.media.length > 1 ? ` · ${p.media.length} files` : ""}</div>
      </div>
      <div className="st">
        <label className="sr-only" htmlFor={`st-${p.id}`}>Status</label>
        <select id={`st-${p.id}`} value={p.status} onChange={(e) => setStatus(p, e.target.value as ContentPost["status"])}>
          {CONTENT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="ct stack" style={{ gap: 20 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Admin</p>
          <h2>Content</h2>
          <p className="muted small">
            {counts.ready} ready · {counts.draft} drafts · {counts.idea} ideas · {counts.posted} posted{openFace ? ` · ${openFace} face-content slots to plan` : ""}
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setShift(shift ? null : { from: today, days: "7" }); setForm(null); }}>Move dates</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => { setForm(form ? null : { title: "", date: today, type: "graphic" }); setShift(null); }}>+ New post</button>
        </div>
      </div>

      {nextUp && (
        <Link href={`/admin/content/${nextUp.id}`} className={`ct-row ct-type-${nextUp.type}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="when"><b>Next up</b>{nice(nextUp.date, { weekday: "short", month: "short", day: "numeric" })}</div>
          <Thumb p={nextUp} />
          <div className="t"><strong>{nextUp.title}</strong><div className="meta">{contentTypeLabel(nextUp.type)} · open it to save the file and copy the caption</div></div>
          <span className="btn btn-sm btn-dark">Open</span>
        </Link>
      )}

      {form && (
        <form className="panel" onSubmit={create}>
          <h3>New post</h3>
          <div className="grid-3" style={{ gap: 12 }}>
            <label>Title<input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Quote: rest is my right" /></label>
            <label>Date <span className="hint">leave empty for an idea</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}>{CONTENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          </div>
          <div className="row"><button className="btn btn-sm btn-primary">Add and open</button><button type="button" className="linkbtn small" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}

      {shift && (
        <form className="panel" onSubmit={doShift}>
          <h3>Move dates</h3>
          <p className="small muted" style={{ margin: 0 }}>Moves every post that isn&rsquo;t posted yet, from a date onward. Use this if a launch moves or you take a week off.</p>
          <div className="grid-2" style={{ gap: 12 }}>
            <label>Starting from<input type="date" required value={shift.from} onChange={(e) => setShift({ ...shift, from: e.target.value })} /></label>
            <label>Move by how many days <span className="hint">7 is one week later, -7 is one week earlier</span><input type="number" required value={shift.days} onChange={(e) => setShift({ ...shift, days: e.target.value })} /></label>
          </div>
          <div className="row"><button className="btn btn-sm btn-primary">Move posts</button><button type="button" className="linkbtn small" onClick={() => setShift(null)}>Cancel</button></div>
        </form>
      )}
      {msg && <p className="small ok-text" role="status">{msg}</p>}

      <div className="tabs" role="tablist">
        {([["list", "Schedule"], ["calendar", "Month"], ["ideas", `Ideas (${posts.filter((p) => !p.date).length})`]] as [View, string][]).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{label}</button>
        ))}
      </div>

      <div className="ct-toolbar" role="group" aria-label="Show one type">
        <button type="button" className="ct-chip" aria-pressed={!only} onClick={() => setOnly("")}>All</button>
        {CONTENT_TYPES.map((t) => (
          <button key={t.id} type="button" className={`ct-chip ct-type-${t.id}`} aria-pressed={only === t.id} onClick={() => setOnly(only === t.id ? "" : t.id)}>
            <span className="ct-dot" />{t.label}<span className="n">{posts.filter((p) => p.type === t.id).length}</span>
          </button>
        ))}
        {view === "list" && <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: "auto" }}><input type="checkbox" checked={showPosted} onChange={() => setShowPosted(!showPosted)} /> Show posted</label>}
      </div>

      {view === "list" && (
        <div className="ct-list">
          {weeks.length === 0 && <p className="muted">Nothing scheduled{only ? " of this type" : ""}. Add a post, or give an idea a date.</p>}
          {weeks.map(([wk, items]) => (
            <section key={wk} className="ct-week">
              <h3>Week of {nice(wk, { month: "long", day: "numeric" })}</h3>
              <div className="ct-rows">{items.map(row)}</div>
            </section>
          ))}
        </div>
      )}

      {view === "calendar" && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="row between">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>&larr; Previous</button>
            <h3 style={{ margin: 0 }}>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next &rarr;</button>
          </div>
          <p className="ct-cal-note small muted">The month grid is easier on a bigger screen. On your phone, use Schedule.</p>
          <div className="ct-cal-wrap">
            <div className="ct-month">
              {DAYS.map((d) => <div key={d} className="h">{d}</div>)}
              {cells.map((d) => {
                const k = iso(d);
                return (
                  <div key={k} className={`ct-cell${d.getMonth() !== month.getMonth() ? " out" : ""}${k === today ? " today" : ""}`}>
                    <span className="d">{d.getDate()}</span>
                    {dated.filter((p) => p.date === k).map((p) => (
                      <Link key={p.id} href={`/admin/content/${p.id}`} className={`ct-pill ct-type-${p.type}${p.status === "posted" ? " posted" : ""}`} title={`${contentTypeLabel(p.type)}: ${p.title}`}>{p.launch ? "★ " : ""}{p.title}</Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === "ideas" && (
        <div className="stack" style={{ gap: 10 }}>
          <p className="small muted" style={{ margin: 0 }}>Posts without a date. Open one and give it a date when you&rsquo;re ready to use it.</p>
          <div className="ct-rows">{ideas.length ? ideas.map(row) : <p className="muted">No ideas saved{only ? " of this type" : ""}.</p>}</div>
        </div>
      )}
    </div>
  );
}
