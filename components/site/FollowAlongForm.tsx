"use client";

import { useState } from "react";

export default function FollowAlongForm() {
  const [f, setF] = useState({ name: "", email: "", company_url: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | { status: string; day: number; sent: boolean }>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/bloom-again", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong. Please try again.");
    setDone(data);
  }

  if (done) {
    const first = f.name.trim().split(/\s+/)[0];
    return (
      <div className="card stack" style={{ gap: 10 }} role="status">
        <h3 style={{ margin: 0, textTransform: "none", letterSpacing: 0, fontSize: "1.5rem" }}>
          {done.status === "already" ? `You're already on your way, ${first}.` : `You're in, ${first}.`}
        </h3>
        <p style={{ margin: 0 }}>
          {done.status === "already"
            ? `You're on Day ${done.day} of 30. Your next note comes tomorrow morning.`
            : done.sent
              ? "Day 1 is in your inbox now. Open your journal to the Bloom Check, and I'll see you tomorrow morning."
              : "Day 1 arrives tomorrow morning. In the meantime, open your journal to the Bloom Check."}
        </p>
        <p className="tiny muted" style={{ margin: 0 }}>Don&rsquo;t see it? Check your promotions or spam folder.</p>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} style={{ gap: 16 }}>
      <label className="hp" aria-hidden="true">Leave this empty<input type="text" tabIndex={-1} autoComplete="off" value={f.company_url} onChange={set("company_url")} /></label>
      <div className="grid-2" style={{ gap: 12 }}>
        <label>First name<input type="text" required value={f.name} onChange={set("name")} autoComplete="given-name" /></label>
        <label>Email<input type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
      </div>
      {err && <p className="error-text">{err}</p>}
      <button className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>{busy ? "Starting..." : "Start my 30 days"}</button>
      <p className="tiny muted" style={{ margin: 0 }}>One short email each morning for 30 days. Unsubscribe any time.</p>
    </form>
  );
}
