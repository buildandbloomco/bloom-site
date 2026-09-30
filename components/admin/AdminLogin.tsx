"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setErr(data.error || "Could not sign in.");
    }
    window.location.href = "/admin";
  }

  return (
    <form onSubmit={submit} className="stack">
      <label>
        Admin password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {err && <p className="error-text" role="alert">{err}</p>}
      <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
