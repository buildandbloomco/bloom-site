"use client";

import { useState } from "react";
import type { Build, BuildRequest } from "@/lib/build-def";
import { money } from "@/lib/format";

const STATUS: Record<BuildRequest["status"], string> = { new: "Sent, waiting on us", quoted: "Quoted", added: "Added to your build", declined: "Not adding this" };
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Client side: ask for an add-on during the build and see the answer */
export default function BuildRequests({ initial, addOns }: { initial: Build; addOns: { id: string; name: string; description: string; price: number | null; unit: string }[] }) {
  const [reqs, setReqs] = useState(initial.requests);
  const [pick, setPick] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/portal/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: { addOnId: pick === "other" ? "" : pick, note } }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong."); return; }
    setReqs(j.requests); setPick(""); setNote(""); setMsg("Request sent. We will reply here with a price and timing before anything is added.");
  }
  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="stack" style={{ gap: 12 }} onSubmit={go}>
        <fieldset className="stack" style={{ gap: 6, border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">Choose an add-on</legend>
          {addOns.map((a) => (
            <label key={a.id} className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
              <input type="radio" name="addon" style={{ width: "auto", marginTop: 5 }} checked={pick === a.id} onChange={() => setPick(a.id)} />
              <span><strong>{a.name}</strong>{a.price !== null && <span className="small muted"> · {money(a.price)}{a.unit && a.unit !== "one time" ? ` ${a.unit}` : ""}</span>}<br /><span className="small">{a.description}</span></span>
            </label>
          ))}
          <label className="row" style={{ gap: 10 }}><input type="radio" name="addon" style={{ width: "auto" }} checked={pick === "other"} onChange={() => setPick("other")} /><span><strong>Something else</strong> <span className="small muted">· tell us below</span></span></label>
        </fieldset>
        <label>Anything we should know <span className="hint">{pick === "other" ? "Describe what you have in mind." : "optional"}</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="row" style={{ gap: 12 }}>
          <button className="btn btn-sm btn-primary" disabled={busy || !pick || (pick === "other" && !note.trim())}>{busy ? "Sending..." : "Request this add-on"}</button>
          {msg && <span className="small" role="status">{msg}</span>}
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>Requesting is not buying. Nothing is added or charged until you approve the price.</p>
      </form>
      {reqs.length > 0 && (
        <div>
          {reqs.map((r) => (
            <div className="file-row" key={r.id}>
              <div className="stack" style={{ gap: 2, flex: "1 1 240px" }}>
                <strong>{r.label}</strong>
                {r.note && <span className="small">{r.note}</span>}
                {r.reply && <span className="small" style={{ borderLeft: "3px solid var(--gold)", paddingLeft: 10 }}><strong>Build &amp; Bloom:</strong> {r.reply}</span>}
                <span className="tiny muted">Requested {day(r.at)}</span>
              </div>
              <span className={`tag ${r.status === "added" ? "green" : r.status === "quoted" ? "gold" : ""}`}>{STATUS[r.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
