"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** For seats bought as gifts before the gift details were saved: add who it's for */
export default function MarkGift({ slug, clientId, tier }: { slug: string; clientId: string; tier: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ to: "", email: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!open) return <button type="button" className="linkbtn small" onClick={() => setOpen(true)}>This seat is a gift</button>;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/events/gift", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, clientId, tier, ...f }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error || "That didn't save.");
    router.refresh();
  }
  return (
    <form onSubmit={save} className="stack" style={{ gap: 6, whiteSpace: "normal", minWidth: 200 }}>
      <input type="text" required placeholder="Who it's for" value={f.to} onChange={(x) => setF({ ...f, to: x.target.value })} />
      <input type="email" placeholder="Her email (optional)" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} />
      <input type="text" placeholder="Note on the certificate (optional)" value={f.note} onChange={(x) => setF({ ...f, note: x.target.value })} />
      <div className="row" style={{ gap: 8 }}>
        <button type="submit" className="btn btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="linkbtn small" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {msg && <span className="tiny" role="alert">{msg}</span>}
    </form>
  );
}
