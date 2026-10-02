import { progress, type PlanTask } from "@/lib/plan-types";
import { band, DOMAINS, MIN_GROUP, OPEN_QUESTIONS } from "@/lib/assessment-def";

/** Overall bar plus one bar per side */
export function PlanProgress({ tasks, names = { client: "Your tasks", us: "Build & Bloom" } }: { tasks: PlanTask[]; names?: { client: string; us: string } }) {
  const all = progress(tasks);
  const mine = progress(tasks, "client");
  const ours = progress(tasks, "us");
  const pctDone = all.total ? (all.done / all.total) * 100 : 0;
  const pctDoing = all.total ? (all.doing / all.total) * 100 : 0;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row between" style={{ alignItems: "baseline" }}>
        <strong style={{ fontSize: "1.05rem" }}>{all.pct}% complete</strong>
        <span className="small muted">{all.done} of {all.total} tasks done</span>
      </div>
      <div className="ws-bar" role="img" aria-label={`${all.pct}% complete`}>
        <span className="done" style={{ width: `${pctDone}%` }} />
        <span className="doing" style={{ width: `${pctDoing}%` }} />
      </div>
      <div className="ws-split">
        {[[names.client, mine], [names.us, ours]].map(([label, p]) => {
          const x = p as ReturnType<typeof progress>;
          return (
            <div className="ws-mini" key={label as string}>
              <div className="lab"><b>{label as string}</b><span>{x.done}/{x.total}</span></div>
              <div className="ws-bar" style={{ height: 8 }}>
                <span className="done" style={{ width: `${x.total ? (x.done / x.total) * 100 : 0}%` }} />
                <span className="doing" style={{ width: `${x.total ? (x.doing / x.total) * 100 : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="ws-legend"><span><i style={{ background: "var(--sage-ink)" }} />Done</span><span><i style={{ background: "var(--gold)" }} />In progress</span></div>
    </div>
  );
}

export interface ResultsData {
  team: { id: string; name: string; score: number | null; n: number }[];
  leader: { id: string; score: number | null }[];
  responses: number;
  byRole: { role: string; count: number; scores: { id: string; score: number | null }[] }[];
  comments: string[][];
}

/** Domain scores: team bar with a marker for the leader's view */
export function ResultsChart({ data, showRoles = true }: { data: ResultsData; showRoles?: boolean }) {
  const sorted = [...data.team];
  return (
    <div className="as-res">
      <div className="as-key">
        <span><i style={{ width: 14, height: 10, borderRadius: 3, background: "var(--sage-ink)" }} />Team average (0 to 100)</span>
        <span><i style={{ width: 4, height: 16, background: "var(--espresso)" }} />Leader&rsquo;s view</span>
        <span>{data.responses} team response{data.responses === 1 ? "" : "s"}</span>
      </div>
      {sorted.map((d) => {
        const lead = data.leader.find((l) => l.id === d.id)?.score ?? null;
        const b = band(d.score);
        const cls = d.score === null ? "" : d.score >= 70 ? "" : d.score >= 50 ? "mid" : "low";
        return (
          <div className="as-row" key={d.id}>
            <div className="stack" style={{ gap: 2 }}>
              <span className="nm">{d.name}</span>
              <span className="tiny muted">{DOMAINS.find((x) => x.id === d.id)?.blurb}</span>
            </div>
            <div className="as-track" role="img" aria-label={`${d.name}: team ${d.score ?? "no data"}${lead !== null ? `, leader ${lead}` : ""}`}>
              {d.score !== null && <span className={`team ${cls}`} style={{ width: `${Math.max(2, d.score)}%` }} />}
              <span className="ticks" />
              {lead !== null && <span className="leader" style={{ left: `${lead}%` }} title={`Leader: ${lead}`} />}
            </div>
            <div className="stack" style={{ gap: 2, alignItems: "flex-end" }}>
              <span className="as-num">{d.score ?? "–"}</span>
              {lead !== null && <span className="tiny muted">Leader {lead}</span>}
              <span className={`tag ${b.cls}`} style={{ fontSize: "0.66rem", padding: "3px 8px" }}>{b.label}</span>
            </div>
          </div>
        );
      })}
      {showRoles && data.byRole.length > 0 && (
        <details>
          <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>Scores by role</summary>
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="table">
              <thead><tr><th>Role</th><th>Responses</th>{DOMAINS.map((d) => <th key={d.id}>{d.name.split(" ")[0]}</th>)}</tr></thead>
              <tbody>
                {data.byRole.map((r) => (
                  <tr key={r.role}>
                    <td>{r.role}</td><td>{r.count}</td>
                    {r.count < MIN_GROUP ? <td colSpan={DOMAINS.length} className="muted small">Hidden to protect anonymity (fewer than {MIN_GROUP} responses)</td> : r.scores.map((s) => <td key={s.id}>{s.score ?? "–"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export function Comments({ comments }: { comments: string[][] }) {
  return (
    <div className="stack" style={{ gap: 18 }}>
      {OPEN_QUESTIONS.map((q, i) => {
        const list = comments.map((c) => c[i]).filter((x) => x && x.trim());
        return (
          <div className="stack" key={q} style={{ gap: 8 }}>
            <strong>{q}</strong>
            {list.length ? list.map((t, k) => <p key={k} className="as-quote" style={{ margin: 0 }}>{t}</p>) : <p className="muted small" style={{ margin: 0 }}>No answers yet.</p>}
          </div>
        );
      })}
    </div>
  );
}
