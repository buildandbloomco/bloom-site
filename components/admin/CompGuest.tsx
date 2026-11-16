"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Add a complimentary guest to an event: they take a seat with no payment */
export function CompForm({ slug, tiers }: { slug: string; tiers: { id: string; name: string; left: number | null }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", tierId: tiers[0]?.id ?? "", note: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!tiers.length) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/events/comp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...f }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error || "That didn't save. Try again.");
    setMsg(`${f.name} is on the list.`);
    setF({ ...f, name: "", email: "", note: "", message: "" });
    router.refresh();
  }

  if (!open) return <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => { setOpen(true); setMsg(""); }}>+ Add a complimentary guest</button>{msg && <span className="small muted" style={{ marginLeft: 10 }} role="status">{msg}</span>}</div>;
  return (
    <form onSubmit={submit} className="stack" style={{ gap: 10, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
      <strong className="small">Add a complimentary guest</strong>
      <span className="tiny muted" style={{ marginTop: -6 }}>They take a seat and get a portal, with nothing to pay.</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        <label>Name<input type="text" required value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} /></label>
        <label>Email<input type="email" required value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></label>
        {tiers.length > 1 && (
          <label>Offer<select value={f.tierId} onChange={(x) => setF({ ...f, tierId: x.target.value })}>
            {tiers.map((t) => <option key={t.id} value={t.id} disabled={t.left === 0}>{t.name}{t.left === 0 ? " (full)" : t.left !== null ? ` (${t.left} left)` : ""}</option>)}
          </select></label>
        )}
        <label>Note for you (optional)<input type="text" value={f.note} onChange={(x) => setF({ ...f, note: x.target.value })} /></label>
        <label>Message on their gift certificate (optional)<input type="text" maxLength={160} value={f.message} onChange={(x) => setF({ ...f, message: x.target.value })} /></label>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <button type="submit" className="btn btn-sm" disabled={busy}>{busy ? "Adding…" : "Add guest"}</button>
        <button type="button" className="linkbtn small" onClick={() => setOpen(false)}>Cancel</button>
        {msg && <span className="small" role="status">{msg}</span>}
      </div>
    </form>
  );
}

/** Take a complimentary seat back */
export function RemoveComp({ slug, clientId, name }: { slug: string; clientId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm(`Remove ${name}'s complimentary seat? The seat opens up again. Their portal stays.`)) return;
    setBusy(true);
    const r = await fetch("/api/admin/events/comp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, clientId }) });
    setBusy(false);
    if (!r.ok) return alert((await r.json().catch(() => ({}))).error || "That didn't work. Try again.");
    router.refresh();
  }
  return <button type="button" className="linkbtn danger small" disabled={busy} onClick={remove}>{busy ? "Removing…" : "Remove"}</button>;
}

/** Change the message on a complimentary guest's gift certificate */
export function CompMessage({ slug, clientId, message }: { slug: string; clientId: string; message: string }) {
  const router = useRouter();
  async function edit() {
    const next = prompt("Message on their gift certificate (leave blank for none):", message);
    if (next === null) return;
    const r = await fetch("/api/admin/events/comp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, clientId, message: next.slice(0, 160) }) });
    if (!r.ok) return alert("That didn't save. Try again.");
    router.refresh();
  }
  return <button type="button" className="linkbtn small" onClick={edit}>{message ? "Edit certificate message" : "Add certificate message"}</button>;
}
