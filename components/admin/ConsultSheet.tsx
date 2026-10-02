"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Consult, ConsultAction, Service } from "@/lib/types";
import { CONSULT_TYPES, FOCUS_AREAS, OWNER_LABEL, STAGES, TYPE_QUESTIONS } from "@/lib/consult";
import { money, shortDate } from "@/lib/format";
import { buildQuote, priceFor, TIERS, tierLabel } from "@/lib/tier";

const rid = () => Math.random().toString(36).slice(2, 10);

const SECTIONS: [string, string][] = [
  ["call", "Call details"],
  ["tier", "Client type"],
  ["about", "About them"],
  ["typeq", "Type questions"],
  ["goals", "Goals & vision"],
  ["challenges", "Challenges"],
  ["logistics", "Budget & timing"],
  ["services", "Services & pricing"],
  ["price", "Starting price"],
  ["deliverables", "Deliverables"],
  ["actions", "Action items"],
  ["notes", "Notes"],
  ["confirm", "Wrap up"],
];

export default function ConsultSheet({
  clientId,
  clientName,
  initial,
  services,
}: {
  clientId: string;
  clientName: string;
  initial: Consult;
  services: Service[];
}) {
  const [s, setS] = useState<Consult>(initial);
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const [workMsg, setWorkMsg] = useState("");
  const [propMsg, setPropMsg] = useState("");
  const latest = useRef(s);
  const dirty = useRef(false);
  const url = `/api/admin/clients/${clientId}/consults/${initial.id}`;

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    try {
      const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(latest.current) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setS((p) => ({ ...p, clientConfirmedAt: data.clientConfirmedAt, clientConfirmedBy: data.clientConfirmedBy, clientComment: data.clientComment }));
      setStatus(dirty.current ? "pending" : "saved");
    } catch {
      dirty.current = true;
      setStatus("error");
    }
  }, [url]);

  // Autosave about a second after you stop typing
  useEffect(() => {
    latest.current = s;
    if (!dirty.current) return;
    const t = setTimeout(save, 1000);
    return () => clearTimeout(t);
  }, [s, save]);

  // Last-chance save if the tab closes
  useEffect(() => {
    const flush = () => {
      if (dirty.current) {
        fetch(url, { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(latest.current) });
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [url]);

  function update(fn: (d: Consult) => void) {
    setS((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    dirty.current = true;
    setStatus("pending");
  }

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const core = services.filter((x) => x.kind === "core");
  const addons = services.filter((x) => x.kind === "addon");
  const readyForWork = s.deliverables.filter((d) => d.confirmed && !d.addedToWork && d.title.trim()).length;

  async function sendToWork() {
    await save();
    const res = await fetch(`${url}/to-work`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setWorkMsg(data.error || "Could not add them.");
    setS((p) => ({ ...p, deliverables: data.deliverables }));
    latest.current = { ...latest.current, deliverables: data.deliverables };
    setWorkMsg(`Added ${data.added} to Your Work. Add links and details on the client page.`);
  }

  const quote = buildQuote(s, services);
  const num = (v: string) => (v === "" ? undefined : Math.max(0, Number(v) || 0));

  async function sendToProposal() {
    if (!confirm(`Use ${money(quote.total)} as their proposal? This replaces the services, line items, and total on their client page. You can still edit them there.`)) return;
    await save();
    const res = await fetch(`${url}/to-proposal`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setPropMsg(data.error || "Could not copy it over.");
    setS((p) => ({ ...p, quote: { ...p.quote, appliedAt: data.appliedAt } }));
    setPropMsg(`Their proposal now shows ${money(data.total)}. Review it on the client page before you send their code.`);
  }

  async function remove() {
    if (!confirm("Delete this consultation sheet?")) return;
    dirty.current = false;
    await fetch(url, { method: "DELETE" });
    window.location.href = `/admin/clients/${clientId}`;
  }

  const statusText = { saved: "All changes saved", pending: "Saving soon...", saving: "Saving...", error: "Not saved. Check your connection." }[status];

  const area = (label: string, hint: string, value: string, set: (v: string) => void, rows = 4, placeholder = "") => (
    <label>
      {label} {hint && <span className="hint">{hint}</span>}
      <textarea rows={rows} style={{ minHeight: rows * 28 }} value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
    </label>
  );

  return (
    <>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Consultation sheet</p>
          <h2>{clientName}</h2>
        </div>
        <span className={`small ${status === "error" ? "error-text" : "muted"}`} role="status">{statusText}</span>
      </div>

      <div className="editor-grid">
        <div className="stack" style={{ gap: 20 }}>
          <section className="panel" id="call">
            <h3>Call details</h3>
            <div className="grid-3" style={{ gap: 12 }}>
              <label>Date<input type="date" value={s.date} onChange={(e) => update((d) => void (d.date = e.target.value))} /></label>
              <label>
                Type of call
                <select value={s.type} onChange={(e) => update((d) => void (d.type = e.target.value))}>
                  {CONSULT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>On the call<input type="text" value={s.attendees} placeholder="Names" onChange={(e) => update((d) => void (d.attendees = e.target.value))} /></label>
            </div>
          </section>

          <section className="panel" id="tier">
            <h3>Who is this consult for?</h3>
            <p className="small muted">Pick one. It sets the questions below and which prices are suggested.</p>
            <div className="grid-2" style={{ gap: 12 }}>
              {TIERS.map((t) => (
                <button key={t.id} type="button" aria-pressed={s.tier === t.id} className={`btn ${s.tier === t.id ? "btn-dark" : "btn-ghost"}`} style={{ height: "auto", padding: "14px 16px", flexDirection: "column", alignItems: "flex-start", gap: 4, textAlign: "left", whiteSpace: "normal" }}
                  onClick={() => update((d) => void (d.tier = d.tier === t.id ? "" : t.id))}>
                  <span>{t.label}</span>
                  <span style={{ fontSize: "0.78rem", letterSpacing: 0, textTransform: "none", fontWeight: 400, opacity: 0.85 }}>{t.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel" id="about">
            <h3>About them</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              <label>Business or organization<input type="text" value={s.about.business} onChange={(e) => update((d) => void (d.about.business = e.target.value))} /></label>
              <label>
                Stage
                <select value={s.about.stage} onChange={(e) => update((d) => void (d.about.stage = e.target.value))}>
                  <option value="">Choose one</option>
                  {STAGES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Team size<input type="text" placeholder="Just me, 3 staff, 10 volunteers..." value={s.about.teamSize} onChange={(e) => update((d) => void (d.about.teamSize = e.target.value))} /></label>
              <label>Website & socials<input type="text" value={s.about.links} onChange={(e) => update((d) => void (d.about.links = e.target.value))} /></label>
            </div>
            {area("What they do", "their offer, programs, or mission", s.about.offer, (v) => update((d) => void (d.about.offer = v)), 3)}
            {area("Who they serve", "", s.about.audience, (v) => update((d) => void (d.about.audience = v)), 2)}
          </section>

          <section className="panel" id="typeq">
            <h3>{s.tier === "org" ? "Their team & operations" : s.tier === "business" ? "Their business today" : "Type questions"}</h3>
            {!s.tier && <p className="small muted">Choose small business or organization above to see the questions for that kind of client.</p>}
            {s.tier && TYPE_QUESTIONS[s.tier].map((f) => (
              <label key={f.key}>
                {f.label} <span className="hint">{f.hint}</span>
                <textarea rows={2} style={{ minHeight: 56 }} value={s.typeAnswers[f.key] ?? ""} onChange={(e) => update((d) => void (d.typeAnswers[f.key] = e.target.value))} />
              </label>
            ))}
          </section>

          <section className="panel" id="goals">
            <h3>Goals & vision</h3>
            {area("What they want to accomplish", "in their words", s.goals, (v) => update((d) => void (d.goals = v)), 4)}
            {area("What success looks like in 3 to 6 months", "", s.success, (v) => update((d) => void (d.success = v)), 3)}
          </section>

          <section className="panel" id="challenges">
            <h3>Challenges & focus areas</h3>
            <div className="checks" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              {FOCUS_AREAS.map((f) => (
                <label key={f}>
                  <input type="checkbox" checked={s.focusAreas.includes(f)} onChange={() => update((d) => void (d.focusAreas = toggle(d.focusAreas, f)))} />
                  {f}
                </label>
              ))}
            </div>
            {area("What is getting in the way", "pain points, bottlenecks, what feels heavy", s.challenges, (v) => update((d) => void (d.challenges = v)), 4)}
            {area("Tools & systems they use now", "", s.tools, (v) => update((d) => void (d.tools = v)), 2, "Google Workspace, Canva, Square...")}
          </section>

          <section className="panel" id="logistics">
            <h3>Budget & timing</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              <label>Budget range<input type="text" placeholder="$1,500 to $3,000" value={s.budget} onChange={(e) => update((d) => void (d.budget = e.target.value))} /></label>
              <label>Ideal start date<input type="date" value={s.startDate} onChange={(e) => update((d) => void (d.startDate = e.target.value))} /></label>
            </div>
            {area("Deadlines & key dates", "launches, events, grant deadlines", s.keyDates, (v) => update((d) => void (d.keyDates = v)), 2)}
          </section>

          <section className="panel" id="services">
            <h3>Services & pricing</h3>
            <p className="small muted">
              Check what you discuss. {s.tier ? `Suggested prices are for a ${tierLabel(s.tier).toLowerCase()}.` : "Choose the client type above to see the right suggested prices."} Change the price or the number of sessions or months for this client. The starting price adds up as you go.
            </p>
            {([["Core services", core], ["A la carte", addons]] as const).map(([title, list]) => (
              <div className="stack" key={title} style={{ gap: 8 }}>
                <strong className="tiny muted" style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>{title}</strong>
                {list.map((sv) => {
                  const on = s.serviceIds.includes(sv.id);
                  const suggested = priceFor(sv, s.tier);
                  const line = quote.lines.find((l) => l.id === sv.id);
                  return (
                    <div key={sv.id} className="stack" style={{ gap: 6, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                      <label style={{ flexDirection: "row", alignItems: "center", gap: 10, fontWeight: on ? 600 : 400 }}>
                        <input type="checkbox" checked={on} style={{ width: 18, height: 18, accentColor: "var(--rust)", flexShrink: 0 }} onChange={() => update((d) => void (d.serviceIds = toggle(d.serviceIds, sv.id)))} />
                        <span style={{ flex: 1 }}>{sv.name}</span>
                        <span className="small muted" style={{ fontWeight: 400, whiteSpace: "nowrap" }}>{suggested === null ? "Custom quote" : `${money(suggested)}${sv.unit ? ` ${sv.unit}` : ""}`}</span>
                      </label>
                      {on && (
                        <div className="row" style={{ gap: 10, paddingLeft: 28, alignItems: "center", flexWrap: "wrap" }}>
                          <label style={{ flexDirection: "row", alignItems: "center", gap: 6, fontWeight: 400 }} className="small">
                            Price $
                            <input type="number" min={0} step="1" aria-label={`Price for ${sv.name}`} style={{ width: 110, minHeight: 38, padding: "4px 10px" }} placeholder={suggested === null ? "Set a price" : String(suggested)}
                              value={s.quote.prices[sv.id] ?? ""} onChange={(e) => update((d) => { const v = num(e.target.value); if (v === undefined) delete d.quote.prices[sv.id]; else d.quote.prices[sv.id] = v; })} />
                          </label>
                          <label style={{ flexDirection: "row", alignItems: "center", gap: 6, fontWeight: 400 }} className="small">
                            How many
                            <input type="number" min={1} max={99} step="1" aria-label={`Quantity for ${sv.name}`} style={{ width: 76, minHeight: 38, padding: "4px 10px" }}
                              value={s.quote.qty[sv.id] ?? 1} onChange={(e) => update((d) => void (d.quote.qty[sv.id] = Math.max(1, Math.round(Number(e.target.value) || 1))))} />
                          </label>
                          <span className="small" style={{ marginLeft: "auto" }}>
                            {line?.custom && suggested !== null && <span className="muted">suggested {money(suggested)} · </span>}
                            <strong>{line && line.price !== null ? money(line.total) : "Needs a price"}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </section>

          <section className="panel" id="price">
            <h3>Starting price</h3>
            {quote.lines.length === 0 ? <p className="small muted">Check services above and the starting price builds here.</p> : (
              <>
                <ul className="lines small">
                  {quote.lines.map((l) => (
                    <li key={l.id}><span>{l.name}{l.qty > 1 ? ` x ${l.qty}` : ""}</span><strong>{l.price === null ? "Needs a price" : money(l.total)}</strong></li>
                  ))}
                  {quote.discount > 0 && <li><span>{s.quote.discountNote || "Adjustment"}</span><strong>-{money(quote.discount)}</strong></li>}
                </ul>
                <div className="row between" style={{ borderTop: "2px solid var(--gold)", paddingTop: 10 }}>
                  <strong>Starting price{s.tier ? ` · ${tierLabel(s.tier)}` : ""}</strong>
                  <strong style={{ fontSize: "1.4rem", color: "var(--rust)" }}>{money(quote.total)}</strong>
                </div>
                {quote.unpriced > 0 && <p className="small error-text" style={{ margin: 0 }}>{quote.unpriced} service{quote.unpriced === 1 ? " has" : "s have"} no price yet. Type one in above.</p>}
              </>
            )}
            <div className="grid-2" style={{ gap: 12 }}>
              <label>Adjustment ($ off) <span className="hint">bundle, community rate, sliding scale</span><input type="number" min={0} step="1" value={s.quote.discount || ""} onChange={(e) => update((d) => void (d.quote.discount = num(e.target.value) ?? 0))} /></label>
              <label>Reason shown on the proposal<input type="text" placeholder="Community rate" value={s.quote.discountNote} onChange={(e) => update((d) => void (d.quote.discountNote = e.target.value))} /></label>
            </div>
            <label>Pricing note <span className="hint">payment plan, what could change the price</span><input type="text" value={s.quote.note} onChange={(e) => update((d) => void (d.quote.note = e.target.value))} /></label>
            <div className="checks">
              <label>
                <input type="checkbox" checked={s.quote.share} onChange={() => update((d) => void (d.quote.share = !d.quote.share))} />
                Show this starting price in the summary they see <span className="hint">(only when the sheet is shared)</span>
              </label>
            </div>
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              <button type="button" className="btn btn-sm btn-primary" disabled={!quote.lines.length || quote.unpriced > 0} onClick={sendToProposal}>Use as their proposal</button>
              {s.quote.appliedAt && <span className="small muted">Copied to their proposal {shortDate(s.quote.appliedAt)}</span>}
            </div>
            {propMsg && <p className="ok-text small" style={{ margin: 0 }}>{propMsg} <a href={`/admin/clients/${clientId}`}>Open client page</a></p>}
          </section>

          <section className="panel" id="deliverables">
            <h3>Deliverables</h3>
            <p className="small muted">List what you will create for them. Check “Confirmed” as you agree on each one together.</p>
            {s.deliverables.map((dv, i) => (
              <div className="row" key={dv.id} style={{ flexWrap: "nowrap", gap: 10 }}>
                <input type="text" placeholder="e.g. 90-day strategic plan" value={dv.title} onChange={(e) => update((d) => void (d.deliverables[i].title = e.target.value))} />
                <input type="date" aria-label="Due date" style={{ maxWidth: 170 }} value={dv.due} onChange={(e) => update((d) => void (d.deliverables[i].due = e.target.value))} />
                <label style={{ flexDirection: "row", alignItems: "center", gap: 6, fontWeight: 400, whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={dv.confirmed} onChange={() => update((d) => void (d.deliverables[i].confirmed = !d.deliverables[i].confirmed))} style={{ width: 18, height: 18, accentColor: "var(--rust)" }} />
                  Confirmed
                </label>
                {dv.addedToWork ? <span className="tag green">In Your Work</span> : (
                  <button type="button" className="linkbtn danger small" onClick={() => update((d) => void d.deliverables.splice(i, 1))}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.deliverables.push({ id: rid(), title: "", due: "", confirmed: false, addedToWork: false }))}>
              + Add deliverable
            </button>
          </section>

          <section className="panel" id="actions">
            <h3>Action items & next steps</h3>
            {s.actions.map((a, i) => (
              <div className="row" key={a.id} style={{ flexWrap: "nowrap", gap: 10 }}>
                <input type="checkbox" aria-label="Done" checked={a.done} onChange={() => update((d) => void (d.actions[i].done = !d.actions[i].done))} style={{ width: 20, height: 20, accentColor: "var(--rust)", flexShrink: 0 }} />
                <input type="text" placeholder="e.g. Send proposal, share brand assets" value={a.text} onChange={(e) => update((d) => void (d.actions[i].text = e.target.value))} />
                <select aria-label="Who" style={{ maxWidth: 160 }} value={a.owner} onChange={(e) => update((d) => void (d.actions[i].owner = e.target.value as ConsultAction["owner"]))}>
                  <option value="us">Build & Bloom</option>
                  <option value="client">Client</option>
                  <option value="both">Together</option>
                </select>
                <input type="date" aria-label="Due date" style={{ maxWidth: 170 }} value={a.due} onChange={(e) => update((d) => void (d.actions[i].due = e.target.value))} />
                <button type="button" className="linkbtn danger small" onClick={() => update((d) => void d.actions.splice(i, 1))}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.actions.push({ id: rid(), text: "", owner: "us", due: "", done: false }))}>
              + Add action item
            </button>
          </section>

          <section className="panel" id="notes">
            <h3>Notes</h3>
            {area("Call notes", "the client can see these if you share the sheet", s.notes, (v) => update((d) => void (d.notes = v)), 8)}
            {area("Private notes", "only you ever see these", s.privateNotes, (v) => update((d) => void (d.privateNotes = v)), 5, "Impressions, pricing thoughts, follow-up ideas...")}
          </section>

          <section className="panel" id="confirm">
            <h3>Wrap up</h3>
            <div className="checks">
              <label>
                <input type="checkbox" checked={s.reviewedOnCall} onChange={() => update((d) => void (d.reviewedOnCall = !d.reviewedOnCall))} />
                Reviewed this summary together on the call
              </label>
              <label>
                <input type="checkbox" checked={s.shared} onChange={() => update((d) => void (d.shared = !d.shared))} />
                Show this summary in their portal so they can confirm it <span className="hint">(private notes stay hidden)</span>
              </label>
            </div>
            {s.clientConfirmedAt ? (
              <div className="banner ok" style={{ margin: 0 }}>
                <strong>Confirmed by {s.clientConfirmedBy}</strong> on {shortDate(s.clientConfirmedAt)}.
                {s.clientComment && <p style={{ marginTop: 6 }}>Their note: “{s.clientComment}”</p>}
              </div>
            ) : (
              <p className="small muted">{s.shared ? "Waiting for the client to confirm in their portal." : "Not shared with the client yet."}</p>
            )}
          </section>
        </div>

        <aside className="sticky-col">
          <section className="panel">
            <h3>Jump to</h3>
            <nav className="stack" style={{ gap: 6 }} aria-label="Sheet sections">
              {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="small">{label}</a>)}
            </nav>
          </section>
          <section className="panel" style={{ borderTopColor: "var(--gold)" }}>
            <h3>Starting price</h3>
            <strong style={{ fontSize: "1.6rem", color: "var(--rust)" }}>{money(quote.total)}</strong>
            <span className="small muted">{quote.lines.length} service{quote.lines.length === 1 ? "" : "s"}{s.tier ? ` · ${tierLabel(s.tier)} pricing` : " · choose a client type"}</span>
            <a href="#price" className="small">See the breakdown</a>
          </section>
          <section className="panel">
            <h3>After the call</h3>
            <button type="button" className="btn btn-sm btn-dark" disabled={!readyForWork} onClick={sendToWork}>
              Add {readyForWork || ""} confirmed deliverable{readyForWork === 1 ? "" : "s"} to Your Work
            </button>
            {workMsg && <p className="ok-text small">{workMsg}</p>}
            <p className="tiny muted">
              Action items for the client show in their portal as “{OWNER_LABEL.client}” when you share the sheet.
            </p>
            <button type="button" className="linkbtn danger small" style={{ alignSelf: "flex-start" }} onClick={remove}>Delete this sheet</button>
          </section>
        </aside>
      </div>
    </>
  );
}
