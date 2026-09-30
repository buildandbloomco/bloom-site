"use client";
import { isExternal } from "@/lib/booking";

import { useState } from "react";
import { money } from "@/lib/format";

export default function LearnActions({ eid, mode, amount = 0, bookingUrl = "" }: { eid: string; mode: "pay" | "request"; amount?: number; bookingUrl?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [times, setTimes] = useState("");
  const [note, setNote] = useState("");

  if (mode === "pay") {
    return (
      <div className="stack" style={{ gap: 6 }}>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={async () => {
          setBusy(true);
          setMsg("");
          const res = await fetch(`/api/learn/${eid}/pay`, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.url) window.location.href = data.url;
          else { setBusy(false); setMsg(data.error || "Something went wrong."); }
        }}>{busy ? "One moment..." : `Pay ${money(amount)}`}</button>
        {msg && <p className="error-text small">{msg}</p>}
      </div>
    );
  }

  if (msg === "sent") return <p className="ok-text small">Request sent! We will confirm a time by email.</p>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {!open ? (
        <div className="row">
          {bookingUrl && !isExternal(bookingUrl) ? (
            <>
              <a className="btn btn-sm btn-dark" href={bookingUrl}>Book a time</a>
              <button type="button" className="linkbtn small" onClick={() => setOpen(true)}>None of the times work?</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-sm btn-dark" onClick={() => setOpen(true)}>Request a session</button>
              {bookingUrl && <a className="btn btn-sm btn-ghost" href={bookingUrl} target="_blank" rel="noopener noreferrer">Book online</a>}
            </>
          )}
        </div>
      ) : (
        <form className="stack" style={{ gap: 8 }} onSubmit={async (x) => {
          x.preventDefault();
          setBusy(true);
          const res = await fetch(`/api/learn/${eid}/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ times, note }) });
          const data = await res.json().catch(() => ({}));
          setBusy(false);
          setMsg(res.ok ? "sent" : data.error || "Something went wrong.");
        }}>
          <label className="small">A few days and times that work<textarea style={{ minHeight: 70 }} placeholder="Tues or Thurs after 6pm, Sat morning" value={times} onChange={(x) => setTimes(x.target.value)} required /></label>
          <label className="small">What would you like to focus on? <span className="hint">optional</span><input type="text" value={note} onChange={(x) => setNote(x.target.value)} /></label>
          <div className="row">
            <button className="btn btn-sm btn-dark" disabled={busy}>Send request</button>
            <button type="button" className="linkbtn small" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          {msg && msg !== "sent" && <p className="error-text small">{msg}</p>}
        </form>
      )}
    </div>
  );
}
