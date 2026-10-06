"use client";

import "@/components/portal/workspace.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { currentSession, progress, STATUS_LABEL, type Owner, type PlanSession, type PlanTask, type StrategyPlan, type TaskStatus } from "@/lib/plan-types";
import { PlanProgress } from "@/components/portal/WorkspaceBits";

const rid = () => Math.random().toString(36).slice(2, 10);
const nice = (d: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "No date");
const STATUSES: TaskStatus[] = ["todo", "doing", "done"];

/** The session form you fill in live. Saves on its own. Everything here shows in the client's portal except nothing private lives here. */
export default function SessionDesk({ clientId, slug, initial, today }: { clientId: string; slug: string; initial: StrategyPlan; today: string }) {
  const [p, setP] = useState(initial);
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const [activeId, setActiveId] = useState<string>(currentSession(initial)?.id ?? "");
  const [newDate, setNewDate] = useState(today);
  const [carry, setCarry] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<{ title: string; owner: Owner; due: string }>({ title: "", owner: "client", due: "" });
  const [decision, setDecision] = useState("");
  const [agenda, setAgenda] = useState("");
  const latest = useRef(p);
  const dirty = useRef(false);
  const url = `/api/admin/clients/${clientId}/plan`;

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    try {
      const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(latest.current) });
      if (!res.ok) throw new Error();
      setStatus(dirty.current ? "pending" : "saved");
    } catch {
      dirty.current = true;
      setStatus("error");
    }
  }, [url]);

  useEffect(() => {
    latest.current = p;
    if (!dirty.current) return;
    const t = setTimeout(save, 900);
    return () => clearTimeout(t);
  }, [p, save]);

  useEffect(() => {
    const flush = () => { if (dirty.current) fetch(url, { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(latest.current) }); };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [url]);

  function up(fn: (d: StrategyPlan) => void) {
    setP((prev) => { const n = structuredClone(prev); fn(n); return n; });
    dirty.current = true;
    setStatus("pending");
  }

  async function startSession() {
    setBusy(true);
    setMsg("");
    await save();
    const res = await fetch(`${url}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: newDate, carry }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Could not start the session.");
    setP(d.plan);
    latest.current = d.plan;
    setActiveId(d.sessionId);
    setMsg(d.carried ? `New session started. ${d.carried} open item${d.carried === 1 ? "" : "s"} carried forward.` : "New session started.");
  }

  const s = p.sessions.find((x) => x.id === activeId) ?? null;
  const si = s ? p.sessions.findIndex((x) => x.id === s.id) : -1;
  const setS = (fn: (x: PlanSession) => void) => up((d) => { const x = d.sessions.find((y) => y.id === activeId); if (x) fn(x); });
  const setT = (id: string, fn: (t: PlanTask) => void) => up((d) => { const t = d.tasks.find((y) => y.id === id); if (t) fn(t); });
  const tasks = s ? p.tasks.filter((t) => t.sessionId === s.id) : [];
  const elsewhere = p.tasks.filter((t) => t.status !== "done" && t.sessionId !== activeId);
  const others = [...p.sessions].filter((x) => x.id !== activeId).sort((a, b) => (b.date || "0").localeCompare(a.date || "0"));
  const statusText = { saved: "All changes saved", pending: "Saving soon...", saving: "Saving...", error: "Not saved. Check your connection." }[status];

  function addTask() {
    if (!draft.title.trim()) return;
    up((d) => void d.tasks.push({ id: rid(), sessionId: activeId, title: draft.title.trim(), detail: "", owner: draft.owner, due: draft.due, status: "todo", link: { type: "", refId: "", label: "", url: "" }, createdBy: "us", comments: [], domain: "" }));
    setDraft({ ...draft, title: "", due: "" });
  }

  // Called as a function (not a component) so typing in a row never loses focus
  const taskRow = (t: PlanTask, showFrom = false) => {
    const from = showFrom ? p.sessions.find((x) => x.id === t.sessionId)?.title ?? "General" : "";
    const last = t.comments[t.comments.length - 1];
    return (
      <div key={t.id} className={`pl-task ${t.owner}${t.status === "done" ? " is-done" : ""}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="who">{t.owner === "client" ? "Client" : "Build & Bloom"}{t.carriedFrom ? ` · carried from ${t.carriedFrom}` : ""}{from ? ` · ${from}` : ""}</span>
        <input type="text" value={t.title} aria-label="Item" onChange={(e) => setT(t.id, (x) => void (x.title = e.target.value))} style={{ fontWeight: 600, minHeight: 38, padding: "4px 10px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div role="group" aria-label={`Status of ${t.title}`} style={{ display: "flex", gap: 4 }}>
            {STATUSES.map((st) => (
              <button key={st} type="button" aria-pressed={t.status === st} className={`btn btn-sm ${t.status === st ? (st === "done" ? "btn-dark" : st === "doing" ? "btn-gold" : "btn-primary") : "btn-ghost"}`} style={{ padding: "6px 10px", fontSize: "0.7rem" }} onClick={() => setT(t.id, (x) => void (x.status = st))}>{STATUS_LABEL[st]}</button>
            ))}
          </div>
          <select value={t.owner} aria-label="Owner" onChange={(e) => setT(t.id, (x) => void (x.owner = e.target.value as Owner))} style={{ minHeight: 34, padding: "2px 8px", width: "auto", flex: "0 0 auto" }}>
            <option value="client">Client&rsquo;s task</option>
            <option value="us">My task</option>
          </select>
          <input type="date" value={t.due} aria-label="Due date" onChange={(e) => setT(t.id, (x) => void (x.due = e.target.value))} style={{ minHeight: 34, padding: "2px 8px", width: "auto", flex: "0 0 auto" }} />
          {t.due && t.status !== "done" && t.due < today && <span className="small" style={{ color: "var(--rust)", fontWeight: 600 }}>Past due</span>}
          {showFrom && activeId && <button type="button" className="linkbtn small" onClick={() => setT(t.id, (x) => { x.carriedFrom = x.carriedFrom || from; x.sessionId = activeId; })}>Bring into this session</button>}
          <button type="button" className="linkbtn danger small" style={{ marginLeft: "auto" }} onClick={() => confirm("Remove this item?") && up((d) => void (d.tasks = d.tasks.filter((y) => y.id !== t.id)))}>Remove</button>
        </div>
        {last && last.by === "client" && <div className="pl-comment client"><b>Client</b>{last.text}</div>}
      </div>
    );
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <section className="panel" style={{ borderTopColor: "var(--gold)" }}>
        <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
          <h3>Start a new session</h3>
          <span className={`small ${status === "error" ? "error-text" : "muted"}`} role="status">{statusText}</span>
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ width: "auto" }}>Date<input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400, width: "auto" }}>
            <input type="checkbox" checked={carry} onChange={(e) => setCarry(e.target.checked)} style={{ width: "auto" }} /> Carry open items forward and close the last session
          </label>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={startSession}>{busy ? "Starting..." : "+ New session"}</button>
        </div>
        {msg && <p className="ok-text small" style={{ margin: 0 }}>{msg}</p>}
        <div className="row" style={{ gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400, width: "auto" }} className="small">
            <input type="checkbox" checked={p.enabled} onChange={(e) => up((d) => void (d.enabled = e.target.checked))} style={{ width: "auto" }} /> Client can see their sessions in the portal
          </label>
          <a className="small" href={`/api/admin/clients/${clientId}/preview?to=/p/${slug}/plan`} target="_blank" rel="noreferrer">See what they see</a>
        </div>
      </section>

      {!s ? (
        <section className="panel"><p className="muted" style={{ margin: 0 }}>No sessions yet. Click &ldquo;+ New session&rdquo; when you meet.</p></section>
      ) : (
        <section className="panel">
          <div className="row between" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="stack" style={{ gap: 2 }}>
              <span className="eyebrow">Session {si + 1} · {nice(s.date)}{s.status === "done" ? " · Complete" : ""}</span>
              <input type="text" value={s.title} aria-label="Session title" onChange={(e) => setS((x) => void (x.title = e.target.value))} style={{ fontFamily: "var(--display)", fontSize: "1.4rem", fontWeight: 700, minHeight: 44 }} />
            </div>
            <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
              <label style={{ width: "auto" }} className="small">Date<input type="date" value={s.date} onChange={(e) => setS((x) => void (x.date = e.target.value))} /></label>
              <label style={{ width: "auto" }} className="small">Time<input type="time" value={s.start} onChange={(e) => setS((x) => void (x.start = e.target.value))} /></label>
              <a className="btn btn-sm btn-primary" href={`/admin/clients/${clientId}/room/${s.id}`}>Open strategy room</a>
              <button type="button" className={`btn btn-sm ${s.status === "done" ? "btn-dark" : "btn-ghost"}`} onClick={() => setS((x) => void (x.status = x.status === "done" ? "planned" : "done"))}>{s.status === "done" ? "Completed ✓" : "Mark complete"}</button>
            </div>
          </div>
          <label>Focus for this session<input type="text" value={s.goal} placeholder="What we are here to move forward" onChange={(e) => setS((x) => void (x.goal = e.target.value))} /></label>

          <div className="stack" style={{ gap: 6 }}>
            <strong className="small">Agenda</strong>
            {s.agenda.map((a, i) => (
              <div key={a.id} className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                <input type="text" value={a.text} aria-label="Agenda item" onChange={(e) => setS((x) => void (x.agenda[i].text = e.target.value))} style={{ minHeight: 36, padding: "4px 10px" }} />
                {a.by === "client" && <span className="tag gold" style={{ whiteSpace: "nowrap" }}>From client</span>}
                <button type="button" className="linkbtn danger small" onClick={() => setS((x) => void x.agenda.splice(i, 1))}>Remove</button>
              </div>
            ))}
            <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
              <input type="text" value={agenda} placeholder="Add an agenda item" onChange={(e) => setAgenda(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && agenda.trim()) { setS((x) => void x.agenda.push({ id: rid(), text: agenda.trim(), by: "us" })); setAgenda(""); } }} style={{ minHeight: 36, padding: "4px 10px" }} />
              <button type="button" className="btn btn-sm btn-ghost" disabled={!agenda.trim()} onClick={() => { setS((x) => void x.agenda.push({ id: rid(), text: agenda.trim(), by: "us" })); setAgenda(""); }}>Add</button>
            </div>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="row between">
              <strong className="small">Status of things</strong>
              <span className="small muted">{tasks.filter((t) => t.status === "done").length} of {tasks.length} completed</span>
            </div>
            {tasks.length === 0 && <p className="small muted" style={{ margin: 0 }}>Nothing yet. Add what each of you will do.</p>}
            <div className="pl-tasks">{tasks.map((t) => taskRow(t))}</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <input type="text" value={draft.title} placeholder="Add a task or item" onChange={(e) => setDraft({ ...draft, title: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addTask()} style={{ flex: "1 1 260px", minHeight: 40 }} />
              <select value={draft.owner} aria-label="Owner" onChange={(e) => setDraft({ ...draft, owner: e.target.value as Owner })} style={{ width: "auto", minHeight: 40 }}>
                <option value="client">Client&rsquo;s task</option>
                <option value="us">My task</option>
              </select>
              <input type="date" value={draft.due} aria-label="Due date" onChange={(e) => setDraft({ ...draft, due: e.target.value })} style={{ width: "auto", minHeight: 40 }} />
              <button type="button" className="btn btn-sm btn-dark" disabled={!draft.title.trim()} onClick={addTask}>Add</button>
            </div>
          </div>

          <label>Session notes <span className="hint">the client sees these</span>
            <textarea rows={5} value={s.notes} onChange={(e) => setS((x) => void (x.notes = e.target.value))} />
          </label>

          <div className="stack" style={{ gap: 6 }}>
            <strong className="small">Decisions we made</strong>
            {s.decisions.map((d, i) => (
              <div key={i} className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                <input type="text" value={d} aria-label="Decision" onChange={(e) => setS((x) => void (x.decisions[i] = e.target.value))} style={{ minHeight: 36, padding: "4px 10px" }} />
                <button type="button" className="linkbtn danger small" onClick={() => setS((x) => void x.decisions.splice(i, 1))}>Remove</button>
              </div>
            ))}
            <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
              <input type="text" value={decision} placeholder="Add a decision" onChange={(e) => setDecision(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && decision.trim()) { setS((x) => void x.decisions.push(decision.trim())); setDecision(""); } }} style={{ minHeight: 36, padding: "4px 10px" }} />
              <button type="button" className="btn btn-sm btn-ghost" disabled={!decision.trim()} onClick={() => { setS((x) => void x.decisions.push(decision.trim())); setDecision(""); }}>Add</button>
            </div>
          </div>
        </section>
      )}

      {elsewhere.length > 0 && (
        <section className="panel">
          <h3>Still open from other sessions</h3>
          <div className="pl-tasks">{elsewhere.map((t) => taskRow(t, true))}</div>
        </section>
      )}

      <section className="panel">
        <div className="row between"><h3>Overall progress</h3><a className="small" href={`/admin/clients/${clientId}/plan`}>Full plan editor</a></div>
        {p.tasks.length ? <PlanProgress tasks={p.tasks} names={{ client: "Client", us: "Build & Bloom" }} /> : <p className="small muted" style={{ margin: 0 }}>No tasks yet.</p>}
      </section>

      {others.length > 0 && (
        <section className="panel">
          <h3>Other sessions</h3>
          {others.map((x) => {
            const ts = p.tasks.filter((t) => t.sessionId === x.id);
            const pr = progress(ts);
            return (
              <details key={x.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <summary style={{ cursor: "pointer" }}>
                  <strong>{x.title}</strong> <span className="small muted">· {nice(x.date)} · {x.status === "done" ? "Complete" : "Open"} · {pr.done}/{pr.total} completed</span>
                </summary>
                <div className="stack" style={{ gap: 6, marginTop: 8 }}>
                  {x.goal && <p className="small" style={{ margin: 0 }}><strong>Focus:</strong> {x.goal}</p>}
                  {x.notes && <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>{x.notes}</p>}
                  {x.decisions.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>{x.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>}
                  {ts.map((t) => <span key={t.id} className="small">{t.status === "done" ? "✓" : t.status === "doing" ? "◐" : "○"} {t.title} <span className="muted">· {t.owner === "client" ? "Client" : "Build & Bloom"} · {STATUS_LABEL[t.status]}</span></span>)}
                  <a className="small" href={`/admin/clients/${clientId}/room/${x.id}`}>Open its strategy room</a>
                  <button type="button" className="linkbtn small" style={{ alignSelf: "flex-start" }} onClick={() => { setActiveId(x.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Open this session to edit</button>
                </div>
              </details>
            );
          })}
        </section>
      )}
    </div>
  );
}
