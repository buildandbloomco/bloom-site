"use client";

import "@/components/portal/workspace.css";
import { useState } from "react";
import { blankLink, LINK_TYPES, type PlanLink, type PlanSession, type PlanTask, type StrategyPlan } from "@/lib/plan-types";
import { PlanProgress } from "@/components/portal/WorkspaceBits";

const rid = () => Math.random().toString(36).slice(2, 10);
type Opt = { id: string; label: string };
export interface LinkOptions { service: Opt[]; course: Opt[]; library: Opt[]; wellness: Opt[] }

function LinkPicker({ value, opts, onChange }: { value: PlanLink; opts: LinkOptions; onChange: (l: PlanLink) => void }) {
  const list = value.type && value.type in opts ? opts[value.type as keyof LinkOptions] : [];
  return (
    <div className="pl-inline">
      <select value={value.type} onChange={(e) => onChange({ ...blankLink(), type: e.target.value as PlanLink["type"] })} aria-label="Link type" style={{ flex: "0 1 220px" }}>
        {LINK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      {list.length > 0 && (
        <select value={value.refId} onChange={(e) => onChange({ ...value, refId: e.target.value, label: "" })} aria-label="Which one">
          <option value="">Choose one</option>
          {list.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      )}
      {value.type === "url" && (
        <>
          <input type="url" placeholder="https://..." value={value.url} onChange={(e) => onChange({ ...value, url: e.target.value })} aria-label="Link" />
          <input type="text" placeholder="Label" value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} aria-label="Link label" />
        </>
      )}
    </div>
  );
}

export default function PlanEditor({ clientId, clientName, slug, initial, opts, assessmentOn }: { clientId: string; clientName: string; slug: string; initial: StrategyPlan; opts: LinkOptions; assessmentOn: boolean }) {
  const [p, setP] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const up = (fn: (d: StrategyPlan) => void) => { setP((prev) => { const d = structuredClone(prev); fn(d); return d; }); setDirty(true); setMsg(""); };
  const upS = (id: string, fn: (s: PlanSession) => void) => up((d) => { const s = d.sessions.find((x) => x.id === id); if (s) fn(s); });
  const upT = (id: string, fn: (t: PlanTask) => void) => up((d) => { const t = d.tasks.find((x) => x.id === id); if (t) fn(t); });

  async function save(next?: StrategyPlan) {
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${clientId}/plan`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next ?? p) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(d.error || "Could not save.");
    setP(d);
    setDirty(false);
    setMsg("Saved");
  }
  async function template(kind: "strategy" | "assessment") {
    if (dirty && !confirm("Save your changes first? Unsaved changes will be lost.")) return;
    const res = await fetch(`/api/admin/clients/${clientId}/plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template: kind }) });
    if (res.ok) { setP(await res.json()); setDirty(false); setMsg("Template added. Edit anything below."); }
  }
  const newTask = (sessionId: string, owner: "client" | "us"): PlanTask => ({ id: rid(), sessionId, title: "", detail: "", owner, due: "", status: "todo", link: blankLink(), createdBy: "us", comments: [], domain: "" });

  const openReqs = p.requests.filter((r) => r.status === "open");

  function TaskEditor({ t }: { t: PlanTask }) {
    const [reply, setReply] = useState("");
    const expanded = openTask === t.id;
    return (
      <div className={`pl-task ${t.owner}${t.status === "done" ? " is-done" : ""}`} style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div className="stack" style={{ gap: 8 }}>
          <div className="pl-inline">
            <input type="text" value={t.title} placeholder="Task" onChange={(e) => upT(t.id, (x) => void (x.title = e.target.value))} aria-label="Task" style={{ flex: "3 1 260px" }} />
            <select value={t.owner} onChange={(e) => upT(t.id, (x) => void (x.owner = e.target.value as PlanTask["owner"]))} aria-label="Who" style={{ flex: "0 1 150px" }}>
              <option value="client">{clientName.split(" ")[0] || "Client"}</option>
              <option value="us">Build &amp; Bloom</option>
            </select>
            <select value={t.status} onChange={(e) => upT(t.id, (x) => void (x.status = e.target.value as PlanTask["status"]))} aria-label="Status" style={{ flex: "0 1 140px" }}>
              <option value="todo">Not started</option><option value="doing">In progress</option><option value="done">Done</option>
            </select>
            <input type="date" value={t.due} onChange={(e) => upT(t.id, (x) => void (x.due = e.target.value))} aria-label="Due" style={{ flex: "0 1 160px" }} />
          </div>
          <div className="m">
            {t.createdBy === "client" && <span className="tag rust" style={{ fontSize: "0.66rem" }}>Added by client</span>}
            {t.link.label && <span className="pl-link">{t.link.label}</span>}
            <button type="button" className="linkbtn small" onClick={() => setOpenTask(expanded ? null : t.id)}>{expanded ? "Close" : `Details, link${t.comments.length ? `, ${t.comments.length} comment${t.comments.length > 1 ? "s" : ""}` : ""}`}</button>
            <button type="button" className="linkbtn danger small" onClick={() => up((d) => void (d.tasks = d.tasks.filter((x) => x.id !== t.id)))}>Remove</button>
          </div>
          {expanded && (
            <div className="stack" style={{ gap: 8 }}>
              <label>Details<textarea style={{ minHeight: 70 }} value={t.detail} onChange={(e) => upT(t.id, (x) => void (x.detail = e.target.value))} /></label>
              <span className="small" style={{ fontWeight: 600 }}>Connect to</span>
              <LinkPicker value={t.link} opts={opts} onChange={(l) => upT(t.id, (x) => void (x.link = l))} />
              {t.comments.map((c) => <div key={c.id} className={`pl-comment ${c.by}`}><b>{c.by === "client" ? clientName.split(" ")[0] : "You"}</b>{c.text}</div>)}
              <div className="pl-inline">
                <input type="text" placeholder="Reply in the thread" value={reply} onChange={(e) => setReply(e.target.value)} aria-label="Reply" />
                <button type="button" className="btn btn-sm btn-dark" disabled={!reply.trim()} onClick={() => { upT(t.id, (x) => void x.comments.push({ id: rid(), by: "us", text: reply, at: new Date().toISOString() })); setReply(""); }}>Add reply</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 22, maxWidth: 1000 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">{clientName} · Strategy plan</p>
          <h2 style={{ textTransform: "none", letterSpacing: 0 }}>{p.title}</h2>
        </div>
        <div className="row">
          <span className={`tag ${p.enabled ? "green" : ""}`}>{p.enabled ? "Showing in portal" : "Hidden from client"}</span>
          <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${clientId}/preview?to=/p/${slug}/plan`} target="_blank" rel="noopener noreferrer">View as client ↗</a>
        </div>
      </div>

      {openReqs.length > 0 && (
        <section className="panel" style={{ borderTopColor: "var(--rust)" }}>
          <h3>Change requests ({openReqs.length} open)</h3>
          {p.requests.map((r, i) => r.status === "open" && (
            <div key={r.id} className="pl-req open">
              <div className="row between"><strong className="small">{r.kind === "question" ? "Question" : r.kind === "new" ? "Add" : r.kind === "remove" ? "Remove" : "Change"} · {r.targetLabel || "The plan"}</strong><span className="tiny muted">{r.at.slice(0, 10)}</span></div>
              <span>{r.text}</span>
              <label>Your reply <span className="hint">the client sees this</span><input type="text" value={r.reply} onChange={(e) => up((d) => void (d.requests[i].reply = e.target.value))} /></label>
              <button type="button" className="btn btn-sm btn-dark" style={{ alignSelf: "flex-start" }} onClick={() => up((d) => void (d.requests[i].status = "resolved"))}>Mark resolved</button>
            </div>
          ))}
        </section>
      )}

      <section className="panel">
        <h3>Plan basics</h3>
        <div className="checks">
          <label><input type="checkbox" checked={p.enabled} onChange={() => up((d) => void (d.enabled = !d.enabled))} /> Show this plan in their portal</label>
          <label><input type="checkbox" checked={p.clientCanAdd} onChange={() => up((d) => void (d.clientCanAdd = !d.clientCanAdd))} /> Let them add their own tasks and agenda items</label>
        </div>
        <label>Plan title<input type="text" value={p.title} onChange={(e) => up((d) => void (d.title = e.target.value))} /></label>
        <label>Focus <span className="hint">one or two sentences at the top of their plan</span><textarea style={{ minHeight: 60 }} value={p.focus} onChange={(e) => up((d) => void (d.focus = e.target.value))} /></label>
        <div className="row">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => template("strategy")}>+ Add 3-session strategy template</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => template("assessment")}>+ Add assessment sessions template</button>
        </div>
        {!assessmentOn && <p className="tiny muted" style={{ margin: 0 }}>Tip: turn on the wellness assessment from their client page to link tasks to it.</p>}
        <PlanProgress tasks={p.tasks} names={{ client: `${clientName.split(" ")[0] || "Client"}'s tasks`, us: "Your tasks" }} />
      </section>

      <section className="panel">
        <div className="row between"><h3>General tasks</h3>
          <div className="row"><button type="button" className="btn btn-sm btn-ghost" onClick={() => up((d) => void d.tasks.push(newTask("", "client")))}>+ Their task</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => up((d) => void d.tasks.push(newTask("", "us")))}>+ Your task</button></div>
        </div>
        <div className="pl-tasks">{p.tasks.filter((t) => !t.sessionId).map((t) => <TaskEditor key={t.id} t={t} />)}</div>
      </section>

      {p.sessions.map((s, i) => (
        <section className="panel" key={s.id}>
          <div className="row between">
            <h3>Session {i + 1}</h3>
            <div className="row" style={{ gap: 12 }}>
              <button type="button" className="linkbtn tiny" disabled={i === 0} onClick={() => up((d) => { const [x] = d.sessions.splice(i, 1); d.sessions.splice(i - 1, 0, x); })}>Move up</button>
              <button type="button" className="linkbtn tiny" disabled={i === p.sessions.length - 1} onClick={() => up((d) => { const [x] = d.sessions.splice(i, 1); d.sessions.splice(i + 1, 0, x); })}>Move down</button>
              <button type="button" className="linkbtn danger tiny" onClick={() => { if (confirm("Remove this session and its tasks?")) up((d) => { d.sessions.splice(i, 1); d.tasks = d.tasks.filter((t) => t.sessionId !== s.id); }); }}>Remove</button>
            </div>
          </div>
          <div className="grid-3" style={{ gap: 12, gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)" }}>
            <label>Title<input type="text" value={s.title} onChange={(e) => upS(s.id, (x) => void (x.title = e.target.value))} /></label>
            <label>Date<input type="date" value={s.date} onChange={(e) => upS(s.id, (x) => void (x.date = e.target.value))} /></label>
            <label>Start (ET)<input type="time" value={s.start} onChange={(e) => upS(s.id, (x) => void (x.start = e.target.value))} /></label>
          </div>
          <div className="checks"><label><input type="checkbox" checked={s.status === "done"} onChange={() => upS(s.id, (x) => void (x.status = x.status === "done" ? "planned" : "done"))} /> Session complete</label></div>
          <label>Goal<input type="text" value={s.goal} onChange={(e) => upS(s.id, (x) => void (x.goal = e.target.value))} /></label>
          <label>Agenda <span className="hint">one item per line. Items they add show &ldquo;(client)&rdquo;.</span>
            <textarea style={{ minHeight: 80 }} value={s.agenda.map((a) => a.text + (a.by === "client" ? " (client)" : "")).join("\n")}
              onChange={(e) => upS(s.id, (x) => void (x.agenda = e.target.value.split("\n").map((line) => { const by = / \(client\)$/.test(line) ? "client" as const : "us" as const; return { id: rid(), text: line.replace(/ \(client\)$/, ""), by }; })))} />
          </label>
          <label>Shared notes <span className="hint">they see these after the session</span><textarea style={{ minHeight: 90 }} value={s.notes} onChange={(e) => upS(s.id, (x) => void (x.notes = e.target.value))} /></label>
          <label>Decisions <span className="hint">one per line</span><textarea style={{ minHeight: 60 }} value={s.decisions.join("\n")} onChange={(e) => upS(s.id, (x) => void (x.decisions = e.target.value.split("\n")))} /></label>
          <div className="stack" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 600 }}>Resources for this session <span className="hint">courses, products, services, Wellness Library pieces, or links</span></span>
            {s.resources.map((r, k) => (
              <div key={k} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}><LinkPicker value={r} opts={opts} onChange={(l) => upS(s.id, (x) => void (x.resources[k] = l))} /></div>
                <button type="button" className="linkbtn danger tiny" onClick={() => upS(s.id, (x) => void x.resources.splice(k, 1))}>Remove</button>
              </div>
            ))}
            <button type="button" className="linkbtn small" style={{ alignSelf: "flex-start" }} onClick={() => upS(s.id, (x) => void x.resources.push({ ...blankLink(), type: "course" }))}>+ Add a resource</button>
          </div>
          <div className="row between"><span className="small" style={{ fontWeight: 600 }}>Tasks</span>
            <div className="row"><button type="button" className="btn btn-sm btn-ghost" onClick={() => up((d) => void d.tasks.push(newTask(s.id, "client")))}>+ Their task</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => up((d) => void d.tasks.push(newTask(s.id, "us")))}>+ Your task</button></div>
          </div>
          <div className="pl-tasks">{p.tasks.filter((t) => t.sessionId === s.id).map((t) => <TaskEditor key={t.id} t={t} />)}</div>
        </section>
      ))}
      <button type="button" className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => up((d) => void d.sessions.push({ id: rid(), title: `Session ${d.sessions.length + 1}`, date: "", start: "", status: "planned", goal: "", agenda: [], notes: "", decisions: [], resources: [] }))}>+ Add a session</button>

      {p.requests.some((r) => r.status === "resolved") && (
        <details className="panel"><summary style={{ cursor: "pointer", fontWeight: 600 }}>Resolved requests</summary>
          {p.requests.filter((r) => r.status === "resolved").map((r) => <div key={r.id} className="pl-req"><strong className="small">{r.targetLabel}</strong><span className="small">{r.text}</span>{r.reply && <span className="small"><strong>You:</strong> {r.reply}</span>}</div>)}
        </details>
      )}

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={() => save()} disabled={saving}>Save</button>}
        </div>
      )}
    </div>
  );
}
