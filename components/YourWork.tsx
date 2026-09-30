import type { Deliverable, PublicClient } from "@/lib/types";
import { shortDate } from "@/lib/format";
import { computeProgress, daysSince, isOverdue } from "@/lib/progress";
import { embedUrl, folderId } from "@/lib/embed";
import TypeIcon, { TYPE_LABELS } from "./TypeIcon";

const STATUS: Record<Deliverable["status"], { label: string; cls: string }> = {
  "in-progress": { label: "In progress", cls: "" },
  review: { label: "Ready for your review", cls: "gold" },
  final: { label: "Final", cls: "green" },
};

export function hasWork(c: PublicClient): boolean {
  return c.deliverables.length > 0 || c.milestones.length > 0 || c.updates.length > 0 || !!c.driveFolderUrl || c.progressOverride !== null;
}

export default function YourWork({ client }: { client: PublicClient }) {
  const progress = computeProgress(client);
  const groups: { name: string; items: Deliverable[] }[] = [];
  for (const d of client.deliverables) {
    let g = groups.find((x) => x.name === d.group);
    if (!g) groups.push((g = { name: d.group, items: [] }));
    g.items.push(d);
  }
  const updates = [...client.updates].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const milestones = [...client.milestones];
  const folderEmbed = client.driveFolderUrl && folderId(client.driveFolderUrl) ? embedUrl(client.driveFolderUrl) : null;

  return (
    <section className="section alt" id="work">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Your work</p>
          <h2>Everything we have built for you</h2>
          <p className="muted">Documents, links, recordings, and content from our work together. Bookmark this page, it updates as we go.</p>
        </div>

        {progress && (
          <div className="progress-card boxed">
            <div className="row between" style={{ alignItems: "baseline" }}>
              <div className="stack" style={{ gap: 2 }}>
                <span className="eyebrow">Project progress</span>
                <span className="muted small">{progress.label}</span>
              </div>
              <span className="big-number" style={{ color: "var(--rust)" }}>{progress.percent}%</span>
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Project progress"
            >
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            {progress.next && (
              <p className="small">
                <strong>Next up:</strong> {progress.next.title} ·{" "}
                <span className={progress.next.overdue ? "overdue" : ""}>
                  {progress.next.overdue ? "Past due " : "Due "}
                  {shortDate(progress.next.due)}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="work-grid">
          <div className="stack" style={{ gap: 28 }}>
            {groups.map((g) => (
              <div key={g.name || "_"} className="stack" style={{ gap: 12 }}>
                {g.name && <h3>{g.name}</h3>}
                {g.items.map((d) => {
                  const st = STATUS[d.status];
                  const late = isOverdue(d.dueDate, d.status === "final");
                  const isNew = daysSince(d.date) <= 14;
                  const embed = d.url ? embedUrl(d.url) : null;
                  return (
                    <article className="deliv" key={d.id}>
                      <div className="deliv-icon"><TypeIcon type={d.type} /></div>
                      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <strong className="choice-title">{d.title}</strong>
                          {isNew && <span className="tag rust">New</span>}
                        </div>
                        <div className="row small muted" style={{ gap: 6 }}>
                          <span>{TYPE_LABELS[d.type]}</span>
                          {d.date && <span>· Added {shortDate(d.date)}</span>}
                          {d.dueDate && d.status !== "final" && (
                            <span className={late ? "overdue" : ""}>· {late ? "Past due" : "Due"} {shortDate(d.dueDate)}</span>
                          )}
                        </div>
                        {d.note && <p className="small">{d.note}</p>}
                        <div className="row" style={{ gap: 8 }}>
                          <span className={`tag ${st.cls}`}>{st.label}</span>
                        </div>
                        {embed && (
                          <details className="preview">
                            <summary>Preview here</summary>
                            <iframe src={embed} title={d.title} loading="lazy" allow="autoplay; fullscreen" allowFullScreen />
                          </details>
                        )}
                      </div>
                      <div>
                        {d.url ? (
                          <a className="btn btn-dark btn-sm" href={d.url} target="_blank" rel="noopener noreferrer">Open</a>
                        ) : (
                          <span className="small muted">Coming soon</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}

            {client.driveFolderUrl && (
              <div className="stack" style={{ gap: 12 }}>
                <div className="row between">
                  <h3>Your shared folder</h3>
                  <a className="btn btn-ghost btn-sm" href={client.driveFolderUrl} target="_blank" rel="noopener noreferrer">Open in Google Drive</a>
                </div>
                {folderEmbed ? (
                  <iframe className="folder-embed" src={folderEmbed} title="Shared Google Drive folder" loading="lazy" />
                ) : null}
                <p className="tiny muted">New files show up here as soon as we add them to your folder.</p>
              </div>
            )}

            {!client.deliverables.length && !client.driveFolderUrl && (
              <p className="muted">Your first deliverables will appear here as soon as they are ready.</p>
            )}
          </div>

          <aside className="stack" style={{ gap: 24 }}>
            {milestones.length > 0 && (
              <div className="panel">
                <h3>Timeline</h3>
                <ol className="timeline">
                  {milestones.map((m) => {
                    const late = isOverdue(m.due, m.done);
                    return (
                      <li key={m.id} className={m.done ? "done" : late ? "late" : ""}>
                        <span className="dot" aria-hidden="true">
                          {m.done && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                          )}
                        </span>
                        <div className="stack" style={{ gap: 0 }}>
                          <span>{m.title}</span>
                          <span className={`tiny ${late ? "overdue" : "muted"}`}>
                            {m.done ? "Complete" : m.due ? `${late ? "Past due" : "Due"} ${shortDate(m.due)}` : "Date to be set"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            {updates.length > 0 && (
              <div className="panel">
                <h3>Latest updates</h3>
                {updates.map((u) => (
                  <div key={u.id} className="stack" style={{ gap: 2, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                    <span className="tiny eyebrow">{shortDate(u.date)}</span>
                    <p className="small" style={{ whiteSpace: "pre-line" }}>{u.text}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
