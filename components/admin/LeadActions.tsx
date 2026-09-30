"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";
import { firstName } from "@/lib/format";

export default function LeadActions({ lead }: { lead: Lead }) {
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
        {lead.clientId ? (
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
