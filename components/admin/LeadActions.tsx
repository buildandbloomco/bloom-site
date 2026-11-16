"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";
import { firstName } from "@/lib/format";

export default function LeadActions({ lead, guest }: { lead: Lead; guest?: { clientId: string; code: string } | null }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const url = `/api/admin/leads/${lead.id}`;

  async function patch(body: Partial<Lead>) {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? "Saved" : "Could not save");
  }

  async function convert() {
    setBusy(true);
    const res = await fetch(`${url}/convert`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setMsg(data.error || "Could not create the client.");
    }
    window.location.href = data.consultId ? `/admin/clients/${data.clientId}/consult/${data.consultId}` : `/admin/clients/${data.clientId}`;
  }

  return (
    <>
      <section className="panel">
        <h3>Next step</h3>
        {guest ? (
          <>
            <p className="small" style={{ margin: 0 }}><span className="tag gold">Event guest</span> They have a guest pass for their event ticket. They sign in with their name{guest.code ? <>: <strong>{guest.code}</strong></> : null}.</p>
            <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${guest.clientId}/preview`} target="_blank" rel="noopener noreferrer">View their ticket ↗</a>
            <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={async () => {
              if (!confirm("Make them an active client? They'll move to Clients with a full portal (Money, business tools, billing) and get a new private access code in place of their name.")) return;
              setBusy(true);
              const r = await fetch(`/api/admin/clients/${guest.clientId}/access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "full" }) });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) { setBusy(false); return setMsg("That didn't work. Try again."); }
              if (j.code) alert(`Done. Their new access code is ${j.code}. Send it to them; their name no longer opens the portal.`);
              window.location.href = `/admin/clients/${guest.clientId}`;
            }}>{busy ? "Working..." : "Make active client"}</button>
            <p className="tiny muted">Do this when they start working with you.</p>
          </>
        ) : lead.clientId ? (
          <a className="btn btn-sm btn-dark" href={`/admin/clients/${lead.clientId}`}>Open their client portal</a>
        ) : (
          <>
            <button type="button" className="btn btn-sm btn-primary" onClick={convert} disabled={busy}>
              {busy ? "Creating..." : "Create client portal"}
            </button>
            <p className="tiny muted">Creates their portal and access code, and starts a consultation sheet already filled in with their answers so you are ready for the call.</p>
          </>
        )}
        <a className="btn btn-sm btn-ghost" href={`mailto:${lead.email}?subject=${encodeURIComponent("Your inquiry with Build & Bloom Collective")}`}>Email {firstName(lead.name)}</a>
      </section>
      <section className="panel">
        <h3>Status</h3>
        <select value={status} onChange={(e) => { const v = e.target.value as Lead["status"]; setStatus(v); patch({ status: v }); }}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Became a client</option>
          <option value="closed">Closed / not a fit</option>
        </select>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => patch({ notes })} />
        </label>
        {msg && <p className="small muted" role="status">{msg}</p>}
        <button
          type="button"
          className="linkbtn danger small"
          style={{ alignSelf: "flex-start" }}
          onClick={async () => {
            if (!confirm("Delete this lead?")) return;
            await fetch(url, { method: "DELETE" });
            window.location.href = "/admin/leads";
          }}
        >
          Delete lead
        </button>
      </section>
    </>
  );
}
