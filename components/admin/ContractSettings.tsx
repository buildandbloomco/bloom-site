"use client";

import { useState } from "react";
import { DEFAULT_TEMPLATE, PLACEHOLDERS, type ContractSettings as CS } from "@/lib/contract-def";

export default function ContractSettings({ initial }: { initial: CS }) {
  const [c, setC] = useState(initial);
  const [text, setText] = useState(initial.template.trim() || DEFAULT_TEMPLATE);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  async function save(patch: Partial<CS>, ok = "Saved") {
    setMsg("Saving...");
    const res = await fetch("/api/admin/contracts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(j.error || "Not saved."); return; }
    setC(j); setMsg(ok);
  }
  const MODES: [CS["mode"], string, string][] = [
    ["send", "Send it automatically", "The agreement goes to their portal the moment they become an active client. You get an email."],
    ["draft", "Draft it for me to review", "The agreement is written and waits on their Agreements page until you send it."],
    ["off", "Off", "You create agreements by hand."],
  ];
  return (
    <section className="panel">
      <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Client contracts</h3><span className="small" role="status">{msg}</span></div>
      <p className="small muted" style={{ margin: 0 }}>When a client becomes active (they accept a proposal, make a first payment, you mark them active, or you add them as an existing client), an agreement is written for them from your template, with their services and pricing filled in. A client who already has an agreement is never sent a second one.</p>
      <fieldset className="stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
        <legend className="sr-only">When a client becomes active</legend>
        {MODES.map(([id, label, hint]) => (
          <label key={id} className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
            <input type="radio" name="cmode" style={{ width: "auto", marginTop: 5 }} checked={c.mode === id} onChange={() => { setC({ ...c, mode: id }); save({ mode: id }); }} />
            <span><strong>{label}</strong><br /><span className="small muted">{hint}</span></span>
          </label>
        ))}
      </fieldset>
      <label className="row" style={{ gap: 10 }}>
        <input type="checkbox" style={{ width: "auto" }} checked={c.requiredToPay} onChange={(e) => { setC({ ...c, requiredToPay: e.target.checked }); save({ requiredToPay: e.target.checked }); }} />
        <span>Hold card payment in the portal until the agreement is signed</span>
      </label>
      <label style={{ maxWidth: 280 }}>Governing state<input type="text" defaultValue={c.state} onBlur={(e) => e.target.value.trim() !== c.state && save({ state: e.target.value })} /></label>
      <div className="banner warn" style={{ margin: 0 }}>This contract is a solid starting point, not legal advice. Have a lawyer licensed in your state review it once before you rely on it. One review covers every client after that.</div>
      <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(!open)}>{open ? "Close the template" : "Read or edit the template"}</button></div>
      {open && (
        <div className="stack" style={{ gap: 10 }}>
          <p className="small muted" style={{ margin: 0 }}>Lines that start with <code># </code> are section headings and are numbered for you. These fill in for each client:</p>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{PLACEHOLDERS.map(([k, d]) => <li key={k}><code>{k}</code> {d}</li>)}</ul>
          <textarea rows={28} value={text} onChange={(e) => setText(e.target.value)} aria-label="Contract template" style={{ fontSize: "0.95rem" }} />
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-sm btn-dark" onClick={() => save({ template: text === DEFAULT_TEMPLATE ? "" : text }, "Template saved. New agreements will use it.")}>Save template</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { if (confirm("Go back to the original wording? Your edits to the template will be lost.")) { setText(DEFAULT_TEMPLATE); save({ template: "" }, "Back to the original template."); } }}>Reset to original</button>
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>Changing the template does not change agreements already created or signed.</p>
        </div>
      )}
    </section>
  );
}
