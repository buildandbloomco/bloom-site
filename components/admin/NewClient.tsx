"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [existing, setExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, existing }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setErr(data.error || "Could not create client.");
    }
    router.push(existing ? `/admin/clients/${data.id}/desk` : `/admin/clients/${data.id}`);
  }

  if (!open) {
    return <button className="btn btn-primary" onClick={() => setOpen(true)}>+ New client</button>;
  }
  return (
    <form onSubmit={create} className="row">
      <input type="text" autoFocus placeholder="Client or organization name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 280 }} />
      <label style={{ flexDirection: "row", alignItems: "center", gap: 6, fontWeight: 400 }} className="small" title="Active right away, with strategy sessions on and no payment sections in their portal">
        <input type="checkbox" checked={existing} onChange={(e) => setExisting(e.target.checked)} style={{ width: "auto" }} /> Existing client, no payment needed
      </label>
      <button className="btn btn-primary" disabled={busy || !name.trim()}>{busy ? "Creating..." : "Create"}</button>
      <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Cancel</button>
      {err && <p className="error-text">{err}</p>}
    </form>
  );
}
