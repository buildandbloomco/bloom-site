"use client";

import { useState } from "react";
import type { PlanLink, PlanSession, PlanTask, StrategyPlan } from "@/lib/plan-types";
import { PlanProgress } from "./WorkspaceBits";

const nice = (d: string) => {
  if (!d) return "";
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};
const t12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} ET`;
};
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const LINK_WORD: Record<string, string> = { service: "Service", course: "Course", library: "Resource", wellness: "Wellness Library", assessment: "Assessment", url: "Link" };

export function LinkChip({ l }: { l: PlanLink }) {
  if (!l.type || !l.label) return null;
  const inner = <><span className="tiny muted" style={{ fontWeight: 400 }}>{LINK_WORD[l.type]}</span> {l.label}</>;
  if (!l.url) return <span className="pl-link">{inner}</span>;
  const ext = /^https?:\/\//.test(l.url);
  return <a className="pl-link" href={l.url} target={ext ? "_blank" : undefined} rel={ext ? "noopener noreferrer" : undefined}>{inner}{ext ? " ↗" : ""}</a>;
}

type Filter = "mine" | "all" | "us" | "done";

export default function PlanBoard({ initial, firstName }: { initial: StrategyPlan; firstName: string }) {
  const [plan, setPlan] = useState(initial);
  const [filter, setFilter] = useState<Filter>("mine");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null); // task id with comments open
  const [req, setReq] = useState<{ targetType: "task" | "session" | "plan"; targetId: string; label: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null); // session id ("" = general) for new task
  const td = today();

  async function act(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/portal/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(d.error || "Something went wrong. Please try again."); return false; }
    setPlan(d);
    if (ok) setMsg(ok);
    return true;
  }

  const cycle = (t: PlanTask) => act({ action: "status", taskId: t.id, status: t.status === "todo" ? "doing" : t.status === "doing" ? "done" : "todo" });
  const visible = (t: PlanTask) =>
    filter === "mine" ? t.owner === "client" && t.status !== "done" : filter === "us" ? t.owner === "us" : filter === "done" ? t.status === "done" : true;

  const upcoming = plan.sessions.filter((s) => s.status !== "done").sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))[0];
  const myOpen = plan.tasks.filter((t) => t.owner === "client" && t.status !== "done");
  const overdue = myOpen.filter((t) => t.due && t.due < td).length;
  const openReqs = plan.requests.filter((r) => r.status === "open");

  function TaskRow({ t }: { t: PlanTask }) {
    const mine = t.owner === "client";
    const [edit, setEdit] = useState(false);
    const [title, setTitle] = useState(t.title);
    const [due, setDue] = useState(t.due);
    const [comment, setComment] = useState("");
    return (
      <div className={`pl-task ${t.owner}${t.status === "done" ? " is-done" : ""}`}>
        <button type="button" className={`pl-check ${t.status}`} disabled={!mine || busy} onClick={() => cycle(t)}
          aria-label={mine ? `Mark "${t.title}" as ${t.status === "todo" ? "in progress" : t.status === "doing" ? "done" : "not started"}` : `Status: ${t.status}`}
          title={mine ? "Tap to move: not started, in progress, done" : "Build & Bloom updates this one"}>
          {t.status === "done" ? "✓" : ""}
        </button>
        <div style={{ minWidth: 0 }}>
          {edit ? (
            <div className="pl-inline">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Task name" />
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" style={{ flex: "0 1 170px" }} />
              <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={async () => { if (await act({ action: "edit", taskId: t.id, title, due }, "Saved")) setEdit(false); }}>Save</button>
              <button type="button" className="linkbtn small" onClick={() => setEdit(false)}>Cancel</button>
            </div>
          ) : (
            <>
              <span className="who">{mine ? "You" : "Build & Bloom"}{t.status === "doing" ? " · In progress" : ""}</span>
              <div className="t">{t.title}</div>
            </>
          )}
          {t.detail && !edit && <div className="d">{t.detail}</div>}
          <div className="m">
            {t.due && <span style={{ color: t.status !== "done" && t.due < td ? "var(--rust)" : undefined, fontWeight: t.due < td && t.status !== "done" ? 600 : 400 }}>Due {nice(t.due)}{t.status !== "done" && t.due < td ? " (past due)" : ""}</span>}
            <LinkChip l={t.link} />
            <button type="button" className="linkbtn small" onClick={() => setOpen(open === t.id ? null : t.id)}>
              {t.comments.length ? `${t.comments.length} comment${t.comments.length > 1 ? "s" : ""}` : "Comment"}
            </button>
            {mine && !edit && <button type="button" className="linkbtn small" onClick={() => setEdit(true)}>Edit</button>}
            {!mine && <button type="button" className="linkbtn small" onClick={() => setReq({ targetType: "task", targetId: t.id, label: t.title })}>Request a change</button>}
            {t.createdBy === "client" && <button type="button" className="linkbtn danger small" onClick={() => act({ action: "delete", taskId: t.id }, "Removed")}>Remove</button>}
          </div>
          {open === t.id && (
            <div className="pl-comments">
              {t.comments.map((c) => (
                <div key={c.id} className={`pl-comment ${c.by}`}><b>{c.by === "client" ? "You" : "Build & Bloom"}</b>{c.text}</div>
              ))}
              <div className="pl-inline">
                <input type="text" placeholder="Add a comment or question" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Comment" />
                <button type="button" className="btn btn-sm btn-dark" disabled={busy || !comment.trim()} onClick={async () => { if (await act({ action: "comment", taskId: t.id, text: comment })) setComment(""); }}>Send</button>
              </div>
            </div>
          )}
        </div>
        <span />
      </div>
    );
  }

  function AddTask({ sessionId }: { sessionId: string }) {
    const [title, setTitle] = useState("");
    const [due, setDue] = useState("");
    return (
      <div className="pl-inline">
        <input type="text" placeholder="What do you want to get done?" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="New task" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" style={{ flex: "0 1 170px" }} />
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !title.trim()} onClick={async () => { if (await act({ action: "add", sessionId, title, due }, "Task added")) setAdding(null); }}>Add task</button>
        <button type="button" className="linkbtn small" onClick={() => setAdding(null)}>Cancel</button>
      </div>
    );
  }

  function AgendaAdd({ s }: { s: PlanSession }) {
    const [text, setText] = useState("");
    return (
      <div className="pl-inline">
        <input type="text" placeholder="Something you want to cover" value={text} onChange={(e) => setText(e.target.value)} aria-label={`Add to agenda for ${s.title}`} />
        <button type="button" className="btn btn-sm btn-ghost" disabled={busy || !text.trim()} onClick={async () => { if (await act({ action: "agenda", sessionId: s.id, text }, "Added to the agenda")) setText(""); }}>Add to agenda</button>
      </div>
    );
  }

  const general = plan.tasks.filter((t) => !t.sessionId && visible(t));

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="ws-hub">
        <div className="ws-card">
          <span className="eyebrow">Progress</span>
          <PlanProgress tasks={plan.tasks} />
        </div>
        <div className="ws-card">
          <span className="eyebrow">At a glance</span>
          <div className="ws-kpis">
            <span><b>{myOpen.length}</b>open for you</span>
            {overdue > 0 && <span style={{ color: "var(--rust)" }}><b style={{ color: "var(--rust)" }}>{overdue}</b>past due</span>}
            <span><b>{plan.tasks.filter((t) => t.owner === "us" && t.status !== "done").length}</b>with Build &amp; Bloom</span>
          </div>
          {upcoming && (
            <div className="stack" style={{ gap: 2 }}>
              <span className="pl-sub">Next session</span>
              <strong>{upcoming.title}</strong>
              <span className="pl-meta">{upcoming.date ? `${nice(upcoming.date)}${upcoming.start ? ` at ${t12(upcoming.start)}` : ""}` : "Date to be set"}</span>
            </div>
          )}
          <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => setReq({ targetType: "plan", targetId: "", label: plan.title })}>Request a change to the plan</button>
        </div>
      </div>

      {req && (
        <RequestForm target={req} busy={busy} onCancel={() => setReq(null)} onSend={async (kind, text) => { if (await act({ action: "request", kind, targetType: req.targetType, targetId: req.targetId, text }, "Request sent. We'll reply here.")) setReq(null); }} />
      )}
      {msg && <p className={`small ${/sent|Saved|added|Added|Removed/.test(msg) ? "ok-text" : "error-text"}`} role="status" style={{ margin: 0 }}>{msg}</p>}

      <div className="pl-head">
        <div className="pl-tabs" role="group" aria-label="Show tasks">
          {([["mine", "My open tasks"], ["all", "Everything"], ["us", "Build & Bloom's tasks"], ["done", "Done"]] as [Filter, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        {plan.clientCanAdd && <button type="button" className="btn btn-sm btn-primary" onClick={() => setAdding("")}>+ Add a task</button>}
      </div>
      {adding === "" && <AddTask sessionId="" />}

      {general.length > 0 && (
        <section className="stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0, textTransform: "none", letterSpacing: 0 }}>General tasks</h3>
          <div className="pl-tasks">{general.map((t) => <TaskRow key={t.id} t={t} />)}</div>
        </section>
      )}

      {plan.sessions.map((s, i) => {
        const tasks = plan.tasks.filter((t) => t.sessionId === s.id);
        const shown = tasks.filter(visible);
        const p = tasks.length ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0;
        return (
          <section key={s.id} className={`pl-session${s.status === "done" ? " done" : ""}`} id={`s-${s.id}`}>
            <header>
              <div className="stack" style={{ gap: 4 }}>
                <span className="pl-sub">Session {i + 1}{s.status === "done" ? " · Complete" : ""}</span>
                <h3>{s.title}</h3>
                <span className="pl-meta">{s.date ? `${nice(s.date)}${s.start ? ` at ${t12(s.start)}` : ""}` : "Date to be set"}</span>
              </div>
              <div className="stack" style={{ gap: 6, alignItems: "flex-end", minWidth: 160 }}>
                <span className="small muted">{p}% of session tasks done</span>
                <div className="ws-bar" style={{ width: 160, height: 8 }}><span className="done" style={{ width: `${p}%` }} /></div>
                <button type="button" className="linkbtn small" onClick={() => setReq({ targetType: "session", targetId: s.id, label: s.title })}>Request a change</button>
              </div>
            </header>
            {s.goal && <p style={{ margin: 0 }}><strong>Goal:</strong> {s.goal}</p>}
            {(s.agenda.length > 0 || (plan.clientCanAdd && s.status !== "done")) && (
              <div className="stack" style={{ gap: 6 }}>
                <span className="pl-sub">Agenda</span>
                {s.agenda.length > 0 && <ul className="pl-agenda">{s.agenda.map((a) => <li key={a.id}>{a.text}{a.by === "client" && <span className="by">added by you</span>}</li>)}</ul>}
                {plan.clientCanAdd && s.status !== "done" && <AgendaAdd s={s} />}
              </div>
            )}
            {s.resources.length > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                <span className="pl-sub">Resources for this session</span>
                <div className="pl-resources">{s.resources.map((r, k) => <LinkChip key={k} l={r} />)}</div>
              </div>
            )}
            {(s.notes || s.decisions.length > 0) && (
              <div className="stack" style={{ gap: 6 }}>
                <span className="pl-sub">Notes and decisions</span>
                {s.notes && <p style={{ margin: 0, whiteSpace: "pre-line" }}>{s.notes}</p>}
                {s.decisions.length > 0 && <ul className="pl-agenda">{s.decisions.map((d, k) => <li key={k}>{d}</li>)}</ul>}
              </div>
            )}
            <div className="stack" style={{ gap: 8 }}>
              <div className="row between">
                <span className="pl-sub">Tasks</span>
                {plan.clientCanAdd && <button type="button" className="linkbtn small" onClick={() => setAdding(s.id)}>+ Add a task to this session</button>}
              </div>
              {adding === s.id && <AddTask sessionId={s.id} />}
              {shown.length ? <div className="pl-tasks">{shown.map((t) => <TaskRow key={t.id} t={t} />)}</div> : <p className="small muted" style={{ margin: 0 }}>{tasks.length ? "Nothing here with this filter." : "No tasks yet."}</p>}
            </div>
          </section>
        );
      })}

      {plan.requests.length > 0 && (
        <section className="stack" style={{ gap: 10 }} id="requests">
          <h3 style={{ margin: 0, textTransform: "none", letterSpacing: 0 }}>Your requests {openReqs.length > 0 && <span className="tag rust" style={{ marginLeft: 8 }}>{openReqs.length} open</span>}</h3>
          {[...plan.requests].reverse().map((r) => (
            <div key={r.id} className={`pl-req${r.status === "open" ? " open" : ""}`}>
              <div className="row between"><strong className="small">{r.targetLabel || "The plan"}</strong><span className={`tag ${r.status === "open" ? "rust" : "green"}`}>{r.status === "open" ? "Waiting on us" : "Answered"}</span></div>
              <span className="small">{r.text}</span>
              {r.reply && <span className="small"><strong>Build &amp; Bloom:</strong> {r.reply}</span>}
            </div>
          ))}
        </section>
      )}
      <p className="small muted" style={{ margin: 0 }}>Tap the box next to any of your tasks to move it from not started, to in progress, to done. Build &amp; Bloom&rsquo;s tasks update on our side.</p>
      <span className="sr-only">{firstName}</span>
    </div>
  );
}

function RequestForm({ target, busy, onCancel, onSend }: { target: { targetType: string; label: string }; busy: boolean; onCancel: () => void; onSend: (kind: string, text: string) => void }) {
  const [kind, setKind] = useState("change");
  const [text, setText] = useState("");
  return (
    <div className="ws-card" style={{ borderTopColor: "var(--rust)" }}>
      <h3>Request a change</h3>
      <p className="small muted" style={{ margin: 0 }}>About: <strong>{target.label}</strong></p>
      <label>What kind of request?
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="change">Change something</option>
          <option value="new">Add something new</option>
          <option value="remove">Remove something</option>
          <option value="question">Ask a question</option>
        </select>
      </label>
      <label>Tell us more<textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: can we move this to after our board meeting on the 14th?" /></label>
      <div className="row">
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !text.trim()} onClick={() => onSend(kind, text)}>Send request</button>
        <button type="button" className="linkbtn small" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
