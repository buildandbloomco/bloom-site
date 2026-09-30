"use client";

import { useState } from "react";

export default function NewCourse() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.href = `/admin/courses/${data.id}`;
    else setBusy(false);
  }
  if (!open) return <button className="btn btn-primary" onClick={() => setOpen(true)}>+ New course</button>;
  return (
    <form onSubmit={create} className="row">
      <input type="text" autoFocus placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: 280 }} />
      <button className="btn btn-primary" disabled={busy || !title.trim()}>Create</button>
      <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
