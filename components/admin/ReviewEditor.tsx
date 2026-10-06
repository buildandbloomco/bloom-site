"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Pick the dates, add your own read on things, and share it with the client when ready */
export default function ReviewEditor({ clientId, from, to, summary, next, shared }: { clientId: string; from: string; to: string; summary: string; next: string; shared: boolean }) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [s, setS] = useState(summary);
  const [n, setN] = useState(next);
  const [isShared, setShared] = useState(shared);
  const [msg, setMsg] = useState("");
  async function save(share: boolean) {
    setMsg("Saving...");
    const res = await fetch(`/api/admin/clients/${clientId}/review`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: f, to: t, summary: s, next: n, share }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(j.error || "Not saved."); return; }
    setShared(share);
    setMsg(share ? "Saved and shared. It is in their portal now." : "Saved. Only you can see it.");
    router.replace(`/admin/clients/${clientId}/review?from=${f}&to=${t}`);
    router.refresh();
  }
  return (
    <section className="panel no-print">
      <h3>Set up this review</h3>
      <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label>From<input type="date" value={f} onChange={(e) => setF(e.target.value)} /></label>
        <label>To<input type="date" value={t} onChange={(e) => setT(e.target.value)} /></label>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => { router.replace(`/admin/clients/${clientId}/review?from=${f}&to=${t}`); router.refresh(); }}>Update dates</button>
      </div>
      <label>Where things stand <span className="hint">Your read on the period, in your words. Shows at the top.</span><textarea rows={4} value={s} onChange={(e) => setS(e.target.value)} /></label>
      <label>What comes next <span className="hint">Your recommendation for the next period. Shows at the bottom.</span><textarea rows={4} value={n} onChange={(e) => setN(e.target.value)} /></label>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => save(false)}>{isShared ? "Save and stop sharing" : "Save, keep private"}</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => save(true)}>{isShared ? "Save and keep sharing" : "Save and share with client"}</button>
        <button type="button" className="btn btn-sm btn-dark" onClick={() => window.print()}>Print or save as PDF</button>
        <span className="small" role="status">{msg || (isShared ? "Shared with the client." : "Not shared yet.")}</span>
      </div>
    </section>
  );
}
