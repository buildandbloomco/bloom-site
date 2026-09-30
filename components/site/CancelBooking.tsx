"use client";

import { useState } from "react";

export default function CancelBooking({ id, token, rebook }: { id: string; token: string; rebook: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  async function cancel(thenRebook: boolean) {
    if (!confirm(thenRebook ? "Cancel this time and pick a new one?" : "Cancel this booking?")) return;
    setBusy(true);
    const res = await fetch("/api/book/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, t: token }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); return setMsg(data.error || "Something went wrong."); }
    if (thenRebook) { window.location.href = rebook; return; }
    setDone(true);
  }

  if (done) return <p className="ok-text">Your booking is cancelled. <a href={rebook}>Book another time</a> whenever you are ready.</p>;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <p className="small muted" style={{ margin: 0 }}>Reschedule to pick a new time, or cancel if you no longer need the call.</p>
      <div className="row">
        <button type="button" className="btn btn-sm btn-dark" disabled={busy} onClick={() => cancel(true)}>Reschedule</button>
        <button type="button" className="linkbtn danger small" disabled={busy} onClick={() => cancel(false)}>Cancel booking</button>
      </div>
      {msg && <p className="error-text small">{msg}</p>}
    </div>
  );
}
