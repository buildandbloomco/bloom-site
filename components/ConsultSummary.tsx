import type { Consult, Service } from "@/lib/types";
import { money, shortDate } from "@/lib/format";
import { buildQuote } from "@/lib/tier";
import { OWNER_LABEL, TYPE_QUESTIONS } from "@/lib/consult";

import ConfirmConsult from "./ConfirmConsult";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <h3 style={{ marginBottom: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

const Para = ({ label, text }: { label?: string; text: string }) =>
  text ? (
    <p className="small" style={{ whiteSpace: "pre-line" }}>
      {label && <strong>{label}: </strong>}
      {text}
    </p>
  ) : null;

export default function ConsultSummary({ consults, services, contactName }: { consults: Consult[]; services: Service[]; contactName: string }) {
  const name = (id: string) => services.find((s) => s.id === id)?.name;
  return (
    <section className="section" id="consult">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Consultation notes</p>
          <h2>What we talked about</h2>
          <p className="muted">A summary of our conversation. Please look it over and confirm, or tell us anything we missed.</p>
        </div>
        <div className="stack" style={{ gap: 18 }}>
          {consults.map((c, i) => {
            const svc = c.serviceIds.map(name).filter(Boolean) as string[];
            const q = c.quote.share ? buildQuote(c, services) : null;
            const typeQs = c.tier ? TYPE_QUESTIONS[c.tier].filter((f) => c.typeAnswers[f.key]) : [];
            const hasAbout = c.about.business || c.about.stage || c.about.teamSize || c.about.offer || c.about.audience;
            return (
              <details key={c.id} className="consult" open={i === 0}>
                <summary>
                  <span className="choice-title">{c.type} · {shortDate(c.date)}</span>
                  {c.clientConfirmedAt ? <span className="tag green">Confirmed</span> : <span className="tag gold">Please review</span>}
                </summary>
                <div className="stack" style={{ gap: 18, marginTop: 18 }}>
                  <div className="grid-2">
                    {hasAbout && (
                      <Block title="About you">
                        <Para label="Business" text={c.about.business} />
                        <Para label="Stage" text={c.about.stage} />
                        <Para label="Team" text={c.about.teamSize} />
                        <Para label="What you do" text={c.about.offer} />
                        <Para label="Who you serve" text={c.about.audience} />
                        {typeQs.map((f) => <Para key={f.key} label={f.label} text={c.typeAnswers[f.key]} />)}
                      </Block>
                    )}
                    {(c.goals || c.success) && (
                      <Block title="Your goals">
                        <Para text={c.goals} />
                        <Para label="Success in 3 to 6 months" text={c.success} />
                      </Block>
                    )}
                    {(c.focusAreas.length > 0 || c.challenges || c.tools) && (
                      <Block title="Where you want support">
                        {c.focusAreas.length > 0 && (
                          <div className="row" style={{ gap: 6 }}>
                            {c.focusAreas.map((f) => <span key={f} className="tag">{f}</span>)}
                          </div>
                        )}
                        <Para text={c.challenges} />
                        <Para label="Current tools" text={c.tools} />
                      </Block>
                    )}
                    {(c.budget || c.startDate || c.keyDates || svc.length > 0) && (
                      <Block title="Scope & timing">
                        {svc.length > 0 && <Para label="Services we discussed" text={svc.join(", ")} />}
                        <Para label="Budget" text={c.budget} />
                        <Para label="Ideal start" text={c.startDate ? shortDate(c.startDate) : ""} />
                        <Para label="Key dates" text={c.keyDates} />
                      </Block>
                    )}
                  </div>

                  {q && q.lines.length > 0 && q.unpriced === 0 && (
                    <Block title="Starting price">
                      <ul className="lines">
                        {q.lines.map((l) => <li key={l.id}><span>{l.name}{l.qty > 1 ? ` x ${l.qty}` : ""}</span><span>{money(l.total)}</span></li>)}
                        {q.discount > 0 && <li><span>{c.quote.discountNote || "Adjustment"}</span><span>-{money(q.discount)}</span></li>}
                        <li><strong>Starting price</strong><strong>{money(q.total)}</strong></li>
                      </ul>
                      <Para text={c.quote.note} />
                      <p className="tiny muted">A starting point from our conversation. Your final proposal may adjust as we confirm scope.</p>
                    </Block>
                  )}

                  {c.deliverables.length > 0 && (
                    <Block title="Deliverables we agreed on">
                      <ul className="lines">
                        {c.deliverables.map((d) => (
                          <li key={d.id}>
                            <span>{d.confirmed ? "✓ " : ""}{d.title}</span>
                            <span className="small muted">{d.due ? `Due ${shortDate(d.due)}` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </Block>
                  )}

                  {c.actions.length > 0 && (
                    <Block title="Next steps">
                      <ul className="lines">
                        {c.actions.map((a) => (
                          <li key={a.id}>
                            <span style={a.done ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>{a.text}</span>
                            <span className="small muted" style={{ whiteSpace: "nowrap" }}>
                              {OWNER_LABEL[a.owner]}{a.due ? ` · ${shortDate(a.due)}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Block>
                  )}

                  {c.notes && (
                    <Block title="Notes from our call">
                      <Para text={c.notes} />
                    </Block>
                  )}

                  <ConfirmConsult
                    consultId={c.id}
                    defaultName={contactName}
                    confirmedAt={c.clientConfirmedAt}
                    confirmedBy={c.clientConfirmedBy}
                    comment={c.clientComment}
                  />
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
