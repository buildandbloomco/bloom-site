"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }
    router.push(`/p/${data.slug}`);
  }

  return (
    <form onSubmit={submit} className="stack">
      <label>
        Access code
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="BLOOM-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </label>
      {err && <p className="error-text" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" disabled={busy || !code.trim()}>
        {busy ? "Opening..." : "Open my portal"}
      </button>
    </form>
  );
}
