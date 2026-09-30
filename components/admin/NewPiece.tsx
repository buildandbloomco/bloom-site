"use client";

import { useState } from "react";
import { PIECE_TYPES } from "@/lib/wellness-types";

export default function NewPiece({ collections }: { collections: string[] }) {
  const [f, setF] = useState({ title: "", type: "journal", collection: collections[0] ?? "Starter library" });
  const [msg, setMsg] = useState("");
  return (
    <form className="panel" style={{ maxWidth: 820 }} onSubmit={async (e) => {
      e.preventDefault();
      const res = await fetch("/api/admin/wellness/pieces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(d.error || "Could not create it.");
      window.location.href = `/admin/wellness/${d.id}`;
    }}>
      <h3>Add a piece</h3>
      <div className="grid-3" style={{ gap: 12 }}>
        <label>Title<input type="text" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label>Type<select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{PIECE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        <label>Collection <span className="hint">e.g. December: Rest and the holidays</span><input type="text" list="collections" value={f.collection} onChange={(e) => setF({ ...f, collection: e.target.value })} /></label>
      </div>
      <datalist id="collections">{collections.map((c) => <option key={c} value={c} />)}</datalist>
      {msg && <p className="error-text">{msg}</p>}
      <button className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }}>Create and edit</button>
    </form>
  );
}
