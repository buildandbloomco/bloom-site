"use client";

import { useState } from "react";
import { optionTotal, type Proposal, type ProposalOption } from "@/lib/proposal-def";
import { money } from "@/lib/format";

interface Svc { id: string; name: string; price: number | null; unit: string; kind: string }
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }) + " ET" : "");
const rid = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);

export default function ProposalEditor({ clientId, slug, initial, services, today }: { clientId: string; slug: string; initial: Proposal; services: Svc[]; today: string }) {
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const locked = p.status === "accepted";
  const expired = p.status === "sent" && !!p.expires && today > p.expires;

  const patch = (x: Partial<Proposal>) => { setP((d) => ({ ...d, ...x })); setDirty(true); };
  const opt = (id: string, x: Partial<ProposalOption>) => patch({ options: p.options.map((o) => (o.id === id ? { ...o, ...x } : o)) });
  async function call(body: Record<string, unknown>, ok: string) {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/admin/clients/${clientId}/proposal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong."); return; }
    setP(j); setDirty(false); setMsg(ok);
  }
  const save = (send?: boolean) => call({ action: "save", intro: p.intro, expires: p.expires, options: p.options, send }, send === true ? "Sent. It is now at the top of their portal." : send === false ? "Pulled back to a draft. They can no longer see it." : "Saved.");
  const accepted = p.options.find((o) => o.id === p.acceptedOptionId);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="panel" style={{ borderTopColor: locked ? "var(--ok)" : p.status === "sent" ? (expired ? "var(--rust)" : "var(--gold)") : undefined }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
          <div className="stack" style={{ gap: 2 }}>
            <h3 style={{ margin: 0 }}>{locked ? "Accepted" : expired ? "Expired" : p.status === "sent" ? "Sent, waiting for their answer" : "Draft"}</h3>
            <span className="small muted">
              {locked ? `${p.acceptedName}${p.acceptedTitle ? `, ${p.acceptedTitle}` : ""} accepted "${accepted?.name ?? "an option"}" on ${when(p.acceptedAt)}. It is now their package and investment.`
                : p.status === "sent" ? `Sent ${when(p.sentAt)}. ${p.viewedAt ? `They opened it ${when(p.viewedAt)}.` : "They have not opened it yet."}${expired ? " The deadline has passed, so they can no longer accept. Change the date and save to reopen it." : ""}`
                : "The client cannot see this yet."}
            </span>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {p.status !== "draft" && <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${clientId}/preview?to=/p/${slug}/proposal`} target="_blank" rel="noreferrer">See what they see &#8599;</a>}
            {locked && <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => confirm("Reopen this proposal as a draft? Their acceptance will be cleared and they will need to accept the new version. Their current package stays as it is until then.") && call({ action: "reopen" }, "Reopened as a draft.")}>Revise</button>}
          </div>
        </div>
        {msg && <span className="small" role="status">{msg}</span>}
      </section>

      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0 }} className="stack">
        <section className="panel">
          <label>Opening note <span className="hint">What you heard in the consult and what this proposal is meant to solve. Shown above the options.</span><textarea rows={5} value={p.intro} onChange={(e) => patch({ intro: e.target.value })} /></label>
          <label style={{ maxWidth: 260 }}>Good through <span className="hint">optional</span><input type="date" value={p.expires} min={today} onChange={(e) => patch({ expires: e.target.value })} /></label>
        </section>

        {p.options.map((o, n) => {
          const total = optionTotal(o);
          return (
            <section className="panel" key={o.id} style={{ marginTop: 18 }}>
              <div className="row between" style={{ gap: 10 }}>
                <h3 style={{ margin: 0 }}>Option {n + 1}{p.options.length === 1 ? " (the only one, so it is a simple yes)" : ""}</h3>
                {p.options.length > 1 && <button type="button" className="linkbtn small" onClick={() => patch({ options: p.options.filter((x) => x.id !== o.id) })}>Remove option</button>}
              </div>
              <div className="grid-2" style={{ gap: 14 }}>
                <label>Name<input type="text" maxLength={120} value={o.name} onChange={(e) => opt(o.id, { name: e.target.value })} placeholder="Foundation, Growth, Full Partnership" /></label>
                {p.options.length > 1 && (
                  <label className="row" style={{ gap: 8, alignSelf: "end", paddingBottom: 10 }}>
                    <input type="checkbox" style={{ width: "auto" }} checked={o.recommended} onChange={(e) => patch({ options: p.options.map((x) => ({ ...x, recommended: x.id === o.id ? e.target.checked : false })) })} />
                    <span>Mark as recommended</span>
                  </label>
                )}
              </div>
              <label>Who this is for <span className="hint">one or two sentences</span><textarea rows={2} value={o.summary} onChange={(e) => opt(o.id, { summary: e.target.value })} /></label>

              <div className="stack" style={{ gap: 6 }}>
                <span className="small" style={{ fontWeight: 600 }}>Services included</span>
                <div className="grid-2" style={{ gap: 4 }}>
                  {services.map((s) => (
                    <label key={s.id} className="row small" style={{ gap: 8, alignItems: "flex-start", flexWrap: "nowrap" }}>
                      <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={o.serviceIds.includes(s.id)} onChange={(e) => opt(o.id, { serviceIds: e.target.checked ? [...o.serviceIds, s.id] : o.serviceIds.filter((x) => x !== s.id) })} />
                      <span>{s.name} <span className="muted tiny">{s.price === null ? "custom" : `${money(s.price)}${s.unit ? ` ${s.unit}` : ""}`}</span></span>
                    </label>
                  ))}
                </div>
                <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => {
                  const have = new Set(o.lineItems.map((l) => l.label));
                  const add = services.filter((s) => o.serviceIds.includes(s.id) && !have.has(s.name)).map((s) => ({ label: s.name, amount: s.price ?? 0 }));
                  opt(o.id, { lineItems: [...o.lineItems, ...add] });
                }}>Add price lines for the checked services</button></div>
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <span className="small" style={{ fontWeight: 600 }}>Other things included <span className="hint">anything not in your services list</span></span>
                {o.customItems.map((i, k) => (
                  <div className="row" key={k} style={{ gap: 8, flexWrap: "nowrap" }}>
                    <input type="text" aria-label="Item" placeholder="Item" value={i.title} onChange={(e) => opt(o.id, { customItems: o.customItems.map((x, m) => (m === k ? { ...x, title: e.target.value } : x)) })} />
                    <input type="text" aria-label="Detail" placeholder="Detail (optional)" value={i.detail} onChange={(e) => opt(o.id, { customItems: o.customItems.map((x, m) => (m === k ? { ...x, detail: e.target.value } : x)) })} />
                    <button type="button" className="linkbtn small" aria-label="Remove item" onClick={() => opt(o.id, { customItems: o.customItems.filter((_, m) => m !== k) })}>×</button>
                  </div>
                ))}
                <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => opt(o.id, { customItems: [...o.customItems, { title: "", detail: "" }] })}>+ Add item</button></div>
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <span className="small" style={{ fontWeight: 600 }}>Price lines <span className="hint">These add up to the total. Use the suggested prices or type your own. A negative number is a discount.</span></span>
                {o.lineItems.map((l, k) => (
                  <div className="row" key={k} style={{ gap: 8, flexWrap: "nowrap" }}>
                    <input type="text" aria-label="Line label" placeholder="What it is" value={l.label} onChange={(e) => opt(o.id, { lineItems: o.lineItems.map((x, m) => (m === k ? { ...x, label: e.target.value } : x)) })} />
                    <input type="number" aria-label="Amount in dollars (negative for a discount)" step="1" style={{ width: 130 }} value={l.amount || ""} placeholder="0" onChange={(e) => opt(o.id, { lineItems: o.lineItems.map((x, m) => (m === k ? { ...x, amount: Number(e.target.value) } : x)) })} />
                    <button type="button" className="linkbtn small" aria-label="Remove line" onClick={() => opt(o.id, { lineItems: o.lineItems.filter((_, m) => m !== k) })}>×</button>
                  </div>
                ))}
                <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => opt(o.id, { lineItems: [...o.lineItems, { label: "", amount: 0 }] })}>+ Add price line</button></div>
              </div>
              <div className="row between" style={{ gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
                <label style={{ maxWidth: 220 }}>Retainer to begin <span className="hint">0 for none</span><input type="number" min={0} step="1" value={o.retainer || ""} placeholder="0" onChange={(e) => opt(o.id, { retainer: Number(e.target.value) })} /></label>
                <div style={{ textAlign: "right" }}><span className="tiny muted">Option total</span><br /><strong style={{ fontSize: "1.5rem", color: "var(--rust)" }}>{money(total)}</strong>{o.retainer > total && <div className="error-text tiny">Retainer is more than the total</div>}</div>
              </div>
            </section>
          );
        })}

        {!locked && (
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {p.options.length < 4 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => patch({ options: [...p.options, { id: rid(), name: "", summary: "", serviceIds: [], customItems: [], lineItems: [], retainer: 0, recommended: false }] })}>+ Add a blank option</button>}
            {p.options.length < 4 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => { const last = p.options[p.options.length - 1]; patch({ options: [...p.options, { ...last, id: rid(), name: `${last.name} (copy)`, recommended: false, customItems: last.customItems.map((x) => ({ ...x })), lineItems: last.lineItems.map((x) => ({ ...x })), serviceIds: [...last.serviceIds] }] }); }}>+ Copy the last option</button>}
          </div>
        )}
      </fieldset>

      {!locked && (
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save()}>Save{dirty ? " changes" : ""}</button>
          {p.status === "draft"
            ? <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save(true)}>Save and send to their portal</button>
            : <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save(false)}>Pull back to draft</button>}
          {p.status === "sent" && dirty && <span className="small muted">Saving updates what they see right away.</span>}
        </div>
      )}
    </div>
  );
}
