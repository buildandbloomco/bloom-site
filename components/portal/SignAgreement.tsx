"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignAgreement({ id, hash, defaultName }: { id: string; hash: string; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/portal/agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name, title, agree, hash }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong. Please try again."); return; }
    router.refresh();
  }
  return (
    <form className="card stack no-print" style={{ gap: 14 }} onSubmit={sign}>
      <h3 style={{ margin: 0 }}>Sign this agreement</h3>
      <div className="grid-2" style={{ gap: 14 }}>
        <label>Your full legal name<input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={defaultName} /></label>
        <label>Your title <span className="hint">optional</span><input type="text" autoComplete="organization-title" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      </div>
      {name.trim() && <div><span className="tiny muted">Your signature</span><br /><span className="sign-line">{name}</span></div>}
      <label className="row" style={{ gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: "auto", marginTop: 4 }} />
        <span>I have read this agreement and I agree to it. I understand that typing my name here is my signature.</span>
      </label>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn btn-primary" disabled={busy || !agree || !name.trim()}>{busy ? "Signing..." : "Sign agreement"}</button>
        {msg && <span className="error-text" role="alert">{msg}</span>}
      </div>
    </form>
  );
}
