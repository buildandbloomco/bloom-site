"use client";

import { useState } from "react";

/** Name and email in exchange for the guide. Free guides download right away; paid ones go to checkout. */
export default function GuideForm({ slug, title, paid }: { slug: string; title: string; paid: boolean }) {
  const [f, setF] = useState({ name: "", email: "", organization: "", working: "", heardFrom: "", company_url: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...f }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error || "Something went wrong. Please try again.");
    if (d.checkout) { window.location.href = d.checkout; return; }
    setUrl(d.url || "");
  }

  if (url) {
    return (
      <div className="panel" role="status">
        <h3>It&rsquo;s yours.</h3>
        <p style={{ margin: 0 }}>Thank you, {f.name.split(" ")[0]}. Your copy of {title} is ready.</p>
        <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer" download>Download the guide (PDF)</a>
        <p className="small muted" style={{ margin: 0 }}>Want help putting it into practice? <a href="/contact">Tell us about your work</a>.</p>
      </div>
    );
  }
  return (
    <form className="panel" onSubmit={submit}>
      <h3>{paid ? "Get the guide" : "Send me the free guide"}</h3>
      <label>Your name<input type="text" required value={f.name} onChange={set("name")} autoComplete="name" /></label>
      <label>Email<input type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
      <label>Business or organization <span className="hint">optional</span><input type="text" value={f.organization} onChange={set("organization")} autoComplete="organization" /></label>
      <label>What are you working on right now? <span className="hint">optional</span><textarea rows={2} value={f.working} onChange={set("working")} /></label>
      <label>How did you hear about us? <span className="hint">optional</span><input type="text" value={f.heardFrom} onChange={set("heardFrom")} /></label>
      <input type="text" name="company_url" value={f.company_url} onChange={set("company_url")} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      {err && <p className="error-text small" role="alert" style={{ margin: 0 }}>{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "One moment..." : paid ? "Continue to payment" : "Get the guide"}</button>
      <p className="tiny muted" style={{ margin: 0 }}>We&rsquo;ll use your email to follow up about the guide and our services. No spam.</p>
    </form>
  );
}
