"use client";

import { useState } from "react";
import { TEAM_SIZES, WELLNESS_INTERESTS } from "@/lib/wellness";
import { firstName } from "@/lib/format";

type Plan = "individual" | "team";

export default function WaitlistForm({ initialPlan }: { initialPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [f, setF] = useState({ name: "", email: "", organization: "", role: "", teamSize: "", note: "", heardFrom: "", company_url: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const shown = WELLNESS_INTERESTS.filter(([k]) => plan === "team" || (k !== "team-checkins"));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, plan, interests }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong. Please try again.");
    setDone(true);
  }

  if (done) {
    return (
      <div className="card stack" style={{ gap: 10 }} role="status">
        <h3 style={{ margin: 0, textTransform: "none", letterSpacing: 0, fontSize: "1.5rem" }}>You&rsquo;re on the list, {firstName(f.name)}.</h3>
        <p style={{ margin: 0 }}>
          {plan === "team"
            ? "We will reach out about founding team access for " + (f.organization || "your team") + "."
            : "You will be among the first to get in, with founding member pricing."}
        </p>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} style={{ gap: 18 }}>
      <fieldset className="stack" style={{ gap: 10, border: 0, padding: 0, margin: 0 }}>
        <legend className="small" style={{ fontWeight: 600, marginBottom: 8 }}>Who is it for?</legend>
        <div className="wl-toggle">
          {([["individual", "For me", "Individual membership"], ["team", "For my team", "Team membership"]] as const).map(([v, t, d]) => (
            <label key={v} className={`choice ${plan === v ? "on" : ""}`} style={{ gridTemplateColumns: "auto minmax(0, 1fr)" }}>
              <input type="radio" name="plan" checked={plan === v} onChange={() => setPlan(v)} />
              <span className="stack" style={{ gap: 2 }}>
                <span className="choice-title">{t}</span>
                <span className="small muted">{d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="hp" aria-hidden="true">Leave this empty<input type="text" tabIndex={-1} autoComplete="off" value={f.company_url} onChange={set("company_url")} /></label>
      <div className="grid-2" style={{ gap: 12 }}>
        <label>Your name<input type="text" required value={f.name} onChange={set("name")} autoComplete="name" /></label>
        <label>Email<input type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
        {plan === "team" ? (
          <>
            <label>Organization<input type="text" required value={f.organization} onChange={set("organization")} autoComplete="organization" /></label>
            <label>Your role<input type="text" placeholder="Executive director, clinical lead, HR..." value={f.role} onChange={set("role")} /></label>
            <label>
              Team size
              <select value={f.teamSize} onChange={set("teamSize")}>
                <option value="">Choose</option>
                {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
              </select>
            </label>
          </>
        ) : (
          <label>What you do <span className="hint">optional</span><input type="text" placeholder="Business owner, counselor, educator..." value={f.role} onChange={set("role")} /></label>
        )}
      </div>

      <fieldset className="stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
        <legend className="small" style={{ fontWeight: 600, marginBottom: 8 }}>What would you use most? <span className="hint">Choose any</span></legend>
        <div className="checks" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {shown.map(([k, l]) => (
            <label key={k} style={{ flexDirection: "row", alignItems: "center", gap: 10, fontWeight: 400 }}>
              <input type="checkbox" checked={interests.includes(k)} onChange={() => setInterests(interests.includes(k) ? interests.filter((x) => x !== k) : [...interests, k])} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        {plan === "team" ? "What is your team carrying right now?" : "What would make this worth it for you?"} <span className="hint">optional</span>
        <textarea value={f.note} onChange={set("note")} />
      </label>
      <label style={{ maxWidth: 420 }}>How did you hear about us? <span className="hint">optional</span><input type="text" value={f.heardFrom} onChange={set("heardFrom")} /></label>
      {err && <p className="error-text">{err}</p>}
      <button className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>{busy ? "Joining..." : "Join the waitlist"}</button>
    </form>
  );
}
