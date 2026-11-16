"use client";

import { useState } from "react";

/** Shows whether someone has a guest pass or a full portal, with a button to switch */
export default function PortalKind({ clientId, guest }: { clientId: string; guest: boolean }) {
  const [busy, setBusy] = useState(false);
  async function change(kind: "guest" | "full") {
    const ask = kind === "full"
      ? "Make them an active client? They'll move from Leads to Clients and get a full portal with Money, the business tools, their package, and billing. They also get a new private access code in place of their name, so send it to them."
      : "Switch them to a guest pass? They'll only see their event ticket, receipt, books, and follow-up call. Nothing is deleted.";
    if (!confirm(ask)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/clients/${clientId}/access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    setBusy(false);
    if (!r.ok) return alert("That didn't work. Try again.");
    const j = await r.json().catch(() => ({}));
    if (j.code) alert(`Done. Their new access code is ${j.code}. Send it to them; their name no longer opens the portal.`);
    // The editor below loaded the old settings, so reload the whole page
    window.location.reload();
  }
  if (!guest) return <div><button type="button" className="linkbtn small" disabled={busy} onClick={() => change("guest")}>Switch to a guest pass</button></div>;
  return (
    <div className="panel" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div className="stack" style={{ gap: 4, flex: "1 1 320px", maxWidth: 640 }}>
        <div className="row" style={{ gap: 10 }}><span className="tag gold">Guest pass</span><strong>Event guest · a lead, not a client yet</strong></div>
        <span className="small muted">They sign in with their name and see their ticket, receipt, books, and follow-up call. They're listed under Leads until you make them an active client.</span>
      </div>
      <button type="button" className="btn btn-sm" disabled={busy} onClick={() => change("full")}>{busy ? "Switching…" : "Make active client"}</button>
    </div>
  );
}
