"use client";

import "@/components/portal/workspace.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Assessment, Recommendation, TeamResponse } from "@/lib/assessment-types";
import { DOMAINS, MIN_GROUP, OPS_FIELDS, PRIORITIES, type Priority } from "@/lib/assessment-def";
import { Comments, ResultsChart, type ResultsData } from "@/components/portal/WorkspaceBits";
import CopyLink from "@/components/portal/CopyLink";

const rid = () => Math.random().toString(36).slice(2, 10);
const STEPS: { id: Assessment["status"]; label: string; hint: string }[] = [
  { id: "leader", label: "Leader questionnaire", hint: "They fill out their part. The team link works too." },
  { id: "team", label: "Team survey open", hint: "Moves here on its own when they submit." },
  { id: "review", label: "Closed for review", hint: "Survey closes. Their answers lock. Only you see results." },
  { id: "shared", label: "Results shared", hint: "Results, your findings and recommendations show in their portal." },
];

interface Props {
  clientId: string;
  clientName: string;
  slug: string;
  initial: Assessment | null;
  responses: TeamResponse[];
  results: ResultsData | null;
  link: string;
  sessions: { id: string; title: string }[];
  taskStatus: Record<string, string>;
}

export default function AssessmentAdmin({ clientId, clientName, slug, initial, responses, results, link, sessions, taskStatus }: Props) {
  const router = useRouter();
  const [a, setA] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toPlan, setToPlan] = useState<Record<string, { owner: "client" | "us"; due: string; sessionId: string }>>({});
  const base = `/api/admin/clients/${clientId}/assessment`;

  async function call(method: string, url: string, body?: unknown) {
    setBusy(true);
    setMsg("");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(d.error || "Something went wrong."); return null; }
    return d;
  }
  async function put(patch: Partial<Assessment> & { newLink?: boolean }) {
    const d = await call("PUT", base, patch);
    if (d) { setA(d); setMsg("Saved"); router.refresh(); }
    return d;
  }

  if (!a) {
    return (
      <div className="ws-card">
        <span className="eyebrow">Organizational Wellness Assessment</span>
        <h3>Not started for {clientName}</h3>
        <p style={{ margin: 0 }}>Turning it on adds the assessment to their portal: a leader questionnaire (pre-filled from their inquiry when we have it) and an anonymous survey link for their team.</p>
        <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy} onClick={async () => { const d = await call("POST", base); if (d) { setA(d); router.refresh(); } }}>Turn on the assessment</button>
        {msg && <p className="error-text small">{msg}</p>}
      </div>
    );
  }

  const up = (fn: (x: Assessment) => void) => { const n = structuredClone(a); fn(n); setA(n); setDirty(true); setMsg(""); };
  const saveText = () => put({ summary: a.summary, recommendations: a.recommendations, closesOn: a.closesOn }).then((d) => d && setDirty(false));
  const p = a.profile;

  async function addToPlan(r: Recommendation) {
    if (dirty) { const ok = await saveText(); if (!ok) return; }
    const o = toPlan[r.id] || { owner: "client", due: "", sessionId: "" };
    const d = await call("POST", `${base}/to-plan`, { recId: r.id, ...o });
    if (d) { setA(d.assessment); setMsg("Added to the strategy plan."); router.refresh(); }
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="stack" style={{ gap: 2 }}>
          <span className="eyebrow">Organizational Wellness Assessment</span>
          <h2 style={{ margin: 0 }}>{clientName}</h2>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 600, width: "auto" }}><input type="checkbox" style={{ width: "auto" }} checked={a.enabled} onChange={(e) => put({ enabled: e.target.checked })} /> Show in their portal</label>
          <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${clientId}/preview?to=/p/${slug}/assessment`} target="_blank" rel="noreferrer">View as client</a>
        </div>
      </div>

      <div className="ws-card">
        <span className="eyebrow">Stage</span>
        <ol className="ws-steps">
          {STEPS.map((s, i) => {
            const cur = STEPS.findIndex((x) => x.id === a.status);
            return (
              <li key={s.id} className={i < cur ? "ok" : i === cur ? "now" : ""}>
                <div className="row between" style={{ flexWrap: "wrap", gap: 8, width: "100%" }}>
                  <span><strong>{s.label}</strong><br /><span className="small muted">{s.hint}</span></span>
                  {i !== cur && <button type="button" className={`btn btn-sm ${s.id === "shared" ? "btn-primary" : "btn-ghost"}`} disabled={busy} onClick={() => {
                    if (s.id === "shared" && !confirm("Share the results with the client now? They'll see scores, your findings and recommendations.")) return;
                    put({ status: s.id });
                  }}>{s.id === "shared" ? "Share results with client" : "Move here"}</button>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="small muted" style={{ margin: 0 }}>Leader questionnaire: {a.leaderSubmittedAt ? `submitted by ${a.leaderName || "the leader"} on ${a.leaderSubmittedAt.slice(0, 10)}` : `${Object.keys(a.leaderAnswers).length} of 28 answered so far`}</p>
      </div>

      <div className="ws-hub">
        <div className="ws-card">
          <span className="eyebrow">Anonymous team survey</span>
          <CopyLink url={link} label="Copy survey link" />
          <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ maxWidth: 200 }}>Closes on <span className="hint">optional</span><input type="date" value={a.closesOn} onChange={(e) => up((x) => { x.closesOn = e.target.value; })} /></label>
            <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => { if (confirm("Make a new link? The old link will stop working.")) put({ newLink: true }); }}>New link</button>
          </div>
        </div>
        <div className="ws-card">
          <span className="eyebrow">Responses</span>
          <div className="ws-kpis">
            <span><b>{responses.length}</b> team responses</span>
            {p.teamSize && <span><b>{p.teamSize}</b> on the team</span>}
          </div>
          {responses.length > 0 && <a className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} href={`${base}/csv`}>Download spreadsheet (CSV)</a>}
          {responses.length > 0 && (
            <details>
              <summary className="small">Manage responses (remove tests or duplicates)</summary>
              <ul className="stack" style={{ gap: 6, padding: 0, listStyle: "none", marginTop: 8 }}>
                {responses.map((r) => (
                  <li key={r.id} className="row between small" style={{ gap: 8 }}>
                    <span>{r.at.slice(0, 16).replace("T", " ")} · {r.role || "No role"}</span>
                    <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={async () => { if (confirm("Delete this response?")) { const d = await call("DELETE", `${base}/responses/${r.id}`); if (d) router.refresh(); } }}>Delete</button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <div className="ws-card">
        <span className="eyebrow">Results (only you see these until you share)</span>
        {results && (results.responses > 0 || results.leader.some((l) => l.score !== null)) ? (
          <>
            <ResultsChart data={results} showRoles />
            {results.responses < MIN_GROUP && <p className="small muted" style={{ margin: 0 }}>Fewer than {MIN_GROUP} team responses so far. Treat the team bars as early signal.</p>}
          </>
        ) : <p className="muted" style={{ margin: 0 }}>No answers yet.</p>}
      </div>

      {results && results.comments.some((c) => c.length) && (
        <div className="ws-card">
          <span className="eyebrow">Team comments</span>
          <Comments comments={results.comments} />
          <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 600, width: "auto" }}><input type="checkbox" style={{ width: "auto" }} checked={a.shareComments} onChange={(e) => put({ shareComments: e.target.checked })} /> Include these comments in the client&rsquo;s results</label>
        </div>
      )}

      <div className="ws-card">
        <span className="eyebrow">About their organization</span>
        <dl className="as-profile" style={{ margin: 0, display: "grid", gap: 10 }}>
          {([["Organization", p.orgName], ["Team size", p.teamSize], ["Roles", p.roles], ["What they do", p.services], ["In place today", p.policies.join(", ")], ["What prompted this", p.priorities], ["Recent changes", p.recentChanges], ["Success in six months", p.success]] as const).map(([k, v]) => (
            <div key={k}><dt className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{k}</dt><dd style={{ margin: 0, whiteSpace: "pre-line" }}>{v || <span className="muted">Not filled in</span>}</dd></div>
          ))}
        </dl>
      </div>

      <div className="ws-card">
        <span className="eyebrow">Operations snapshot</span>
        <p className="small muted" style={{ margin: 0 }}>What the leader reported about how the work is set up. Read this next to the scores above.</p>
        <dl style={{ margin: 0, display: "grid", gap: 10 }}>
          {OPS_FIELDS.map((f) => (
            <div key={f.key}><dt className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{f.label}</dt><dd style={{ margin: 0, whiteSpace: "pre-line" }}>{p[f.key] || <span className="muted">Not filled in</span>}</dd></div>
          ))}
        </dl>
      </div>

      <div className="ws-card">
        <span className="eyebrow">Your findings</span>
        <label>Summary <span className="hint">shown above their recommendations</span><textarea rows={6} value={a.summary} onChange={(e) => up((x) => { x.summary = e.target.value; })} /></label>
      </div>

      <div className="ws-card">
        <div className="row between">
          <span className="eyebrow">Recommendations</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => up((x) => { x.recommendations.push({ id: rid(), domain: "", title: "", detail: "", taskId: "", priority: "now" }); })}>+ Add</button>
        </div>
        <p className="muted small" style={{ margin: 0 }}>This is their prioritized action plan. Give each one a priority. When you save, the list sorts into Now, Next, Later, and the client sees it in that order. Each one can become a task on their strategy plan.</p>
        {a.recommendations.map((r, i) => {
          const o = toPlan[r.id] || { owner: "client" as const, due: "", sessionId: "" };
          const setO = (patch: Partial<typeof o>) => setToPlan({ ...toPlan, [r.id]: { ...o, ...patch } });
          return (
            <div key={r.id} className="pl-task-edit" style={{ display: "grid", gap: 10, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <div className="pl-inline">
                <input type="text" placeholder="Recommendation" value={r.title} onChange={(e) => up((x) => { x.recommendations[i].title = e.target.value; })} aria-label="Recommendation" />
                <select value={r.priority} onChange={(e) => up((x) => { x.recommendations[i].priority = e.target.value as Priority; })} aria-label="Priority" style={{ flex: "0 1 190px" }}>
                  {PRIORITIES.map((pr) => <option key={pr.id} value={pr.id}>{pr.label} ({pr.hint})</option>)}
                </select>
                <select value={r.domain} onChange={(e) => up((x) => { x.recommendations[i].domain = e.target.value; })} aria-label="Area" style={{ flex: "0 1 220px" }}>
                  <option value="">Any area</option>
                  {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <textarea rows={2} placeholder="Details (optional)" value={r.detail} onChange={(e) => up((x) => { x.recommendations[i].detail = e.target.value; })} aria-label="Details" />
              <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
                {r.taskId ? (
                  <span className="small ok-text">On the plan · {taskStatus[r.taskId] === "done" ? "Done" : taskStatus[r.taskId] === "doing" ? "In progress" : taskStatus[r.taskId] ? "To do" : "task removed"}</span>
                ) : (
                  <div className="pl-inline" style={{ flex: "1 1 auto" }}>
                    <select value={o.owner} onChange={(e) => setO({ owner: e.target.value as "client" | "us" })} aria-label="Whose task"><option value="client">Their task</option><option value="us">Our task</option></select>
                    <input type="date" value={o.due} onChange={(e) => setO({ due: e.target.value })} aria-label="Due" />
                    {sessions.length > 0 && <select value={o.sessionId} onChange={(e) => setO({ sessionId: e.target.value })} aria-label="Session"><option value="">No session</option>{sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>}
                    <button type="button" className="btn btn-sm btn-dark" disabled={busy || !r.title.trim()} onClick={() => addToPlan(r)}>Add to plan</button>
                  </div>
                )}
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => up((x) => { x.recommendations.splice(i, 1); })}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{busy ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={saveText} disabled={busy}>Save</button>}
        </div>
      )}
    </div>
  );
}
