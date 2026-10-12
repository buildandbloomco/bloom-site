"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EventGate({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/event/enter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, code }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Something went wrong. Please try again."); setBusy(false); return; }
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="stack">
      <label>Room code<input type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} required /></label>
      {err && <p className="error-text" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" disabled={busy || !code.trim()}>{busy ? "Opening..." : "See my offers"}</button>
    </form>
  );
}
