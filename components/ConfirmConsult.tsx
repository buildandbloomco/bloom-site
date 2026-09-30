"use client";

import { useState } from "react";
import { shortDate } from "@/lib/format";

export default function ConfirmConsult(props: {
  consultId: string;
  defaultName: string;
  confirmedAt: string | null;
  confirmedBy: string;
  comment: string;
}) {
  const [done, setDone] = useState(props.confirmedAt ? { at: props.confirmedAt, by: props.confirmedBy, comment: props.comment } : null);
  const [editing, setEditing] = useState(!props.confirmedAt);
  const [name, setName] = useState(props.confirmedBy || props.defaultName);
  const [comment, setComment] = useState(props.comment);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/portal/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultId: props.consultId, name, comment }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong.");
    setDone({ at: data.at, by: name, comment });
    setEditing(false);
  }

  if (done && !editing) {
    return (
      <div className="banner ok" style={{ margin: 0 }} role="status">
        <strong>Confirmed by {done.by} on {shortDate(done.at)}.</strong> Thank you!
        {done.comment && <p className="small" style={{ marginTop: 6 }}>Your note: “{done.comment}”</p>}
        <button type="button" className="linkbtn small" style={{ marginTop: 6 }} onClick={() => setEditing(true)}>Add another note</button>
      </div>
    );
  }

  return (
    <form className="dark-card stack" onSubmit={submit} style={{ gap: 14 }}>
      <p className="eyebrow gold">Does this look right?</p>
      <label style={{ color: "var(--on-dark)" }}>
        Anything we missed or should change? <span className="hint" style={{ color: "var(--on-dark-3)" }}>Optional</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={3000} />
      </label>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label style={{ color: "var(--on-dark)", flex: 1, minWidth: 200 }}>
          Your name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button className="btn btn-gold" disabled={busy || !name.trim()}>{busy ? "Sending..." : "Confirm summary"}</button>
      </div>
      {err && <p className="error-text" style={{ color: "#ffb4a6" }} role="alert">{err}</p>}
    </form>
  );
}
