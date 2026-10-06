"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptProposal({ options, preselect }: { options: { id: string; name: string; total: number }[]; preselect: string }) {
  const router = useRouter();
  const [pick, setPick] = useState(preselect);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = options.find((o) => o.id === pick);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) { setMsg("Choose an option first."); return; }
    setBusy(true); setMsg("");
    const res = await fetch("/api/portal/proposal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionId: chosen.id, total: chosen.total, name, title, agree }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong. Please try again."); return; }
    router.refresh();
  }
  return (
    <form className="card stack no-print" style={{ gap: 14 }} onSubmit={go} id="accept">
      <h3 style={{ margin: 0 }}>Accept this proposal</h3>
      {options.length > 1 && (
        <fieldset className="stack" style={{ gap: 6, border: 0, padding: 0, margin: 0 }}>
          <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Which option would you like?</legend>
          {options.map((o) => (
            <label key={o.id} className="row" style={{ gap: 8 }}>
              <input type="radio" name="opt" style={{ width: "auto" }} checked={pick === o.id} onChange={() => setPick(o.id)} />
              <span><strong>{o.name}</strong> · ${o.total.toLocaleString("en-US")}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="grid-2" style={{ gap: 14 }}>
        <label>Your full name<input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Your title <span className="hint">optional</span><input type="text" autoComplete="organization-title" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      </div>
      <label className="row" style={{ gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: "auto", marginTop: 4 }} />
        <span>I accept {chosen ? <strong>{chosen.name}</strong> : "this proposal"}{chosen ? ` at $${chosen.total.toLocaleString("en-US")}` : ""} and I am authorized to do so.</span>
      </label>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn btn-primary" disabled={busy || !agree || !name.trim() || !chosen}>{busy ? "Saving..." : "Accept proposal"}</button>
        {msg && <span className="error-text" role="alert">{msg}</span>}
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>Questions first? Reply to our email or book a call from your portal. Nothing is charged when you accept.</p>
    </form>
  );
}
