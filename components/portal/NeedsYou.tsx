export interface Need { label: string; detail?: string; href: string; cta: string }
export interface NextUp { when: string; title: string; joinUrl?: string; roomUrl?: string }

/** The first thing a client sees: only what is waiting on them, and what is coming next */
export default function NeedsYou({ first, needs, next }: { first: string; needs: Need[]; next: NextUp | null }) {
  return (
    <section className="section" id="today" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className={next ? "ws-hub" : "stack"}>
          <div className="ws-card" style={needs.length ? { borderTopColor: "var(--rust)" } : { borderTopColor: "var(--ok)" }}>
            <h3>{needs.length ? (needs.length === 1 ? "One thing needs you" : `${needs.length} things need you`) : `You are all caught up, ${first}`}</h3>
            {needs.length === 0 && <p className="small" style={{ margin: 0 }}>Nothing is waiting on you right now. Everything else on this page is here whenever you need it.</p>}
            {needs.map((n, i) => (
              <div className="file-row" key={i} style={i === 0 ? { borderTop: 0, paddingTop: 0 } : undefined}>
                <div className="stack" style={{ gap: 2, flex: "1 1 220px" }}>
                  <strong>{n.label}</strong>
                  {n.detail && <span className="small muted">{n.detail}</span>}
                </div>
                <a className={`btn btn-sm ${i === 0 ? "btn-primary" : "btn-ghost"}`} href={n.href}>{n.cta}</a>
              </div>
            ))}
          </div>
          {next && (
            <div className="ws-card">
              <span className="eyebrow">Coming up</span>
              <h3>{next.title}</h3>
              <p style={{ margin: 0 }}>{next.when}</p>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {next.joinUrl && <a className="btn btn-sm btn-dark" href={next.joinUrl} target="_blank" rel="noopener noreferrer">Join the call</a>}
                {next.roomUrl && <a className="btn btn-sm btn-ghost" href={next.roomUrl}>Open the session</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
