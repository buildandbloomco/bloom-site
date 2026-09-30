"use client";
import { isExternal } from "@/lib/booking";

import { useState } from "react";
import { firstName } from "@/lib/format";
import { BUDGETS, DECOMPRESSION, FATIGUE_SIGNS, OUTCOMES, SERVICE_AREAS, SUPERVISION, TIMELINES } from "@/lib/inquiry";

type Lane = "orgs" | "business" | "other";

export default function InquiryForm({
  services,
  initialLane,
  initialInterest,
  bookingUrl,
}: {
  services: { id: string; name: string; lane: string }[];
  initialLane: Lane;
  initialInterest: string;
  bookingUrl: string;
}) {
  const [lane, setLane] = useState<Lane>(initialLane);
  const [f, setF] = useState({
    name: "", email: "", phone: "", organization: "", role: "", website: "",
    goals: "", challenges: "", budget: "", timeline: "", heardFrom: "", company_url: "",
  });
  const [interests, setInterests] = useState<string[]>(initialInterest ? [initialInterest] : []);
  const [a, setA] = useState({
    staffLicensed: "", staffInterns: "", staffAdmin: "", serviceAreas: [] as string[], caseIntensity: "",
    fatigueSigns: [] as string[], crisisProtocol: "", billableHours: "", decompression: "", supervision: "",
    modelConflict: "", outcomes: [] as string[], identityDynamics: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const shownServices = services.filter((s) => lane === "other" || s.lane === lane || s.lane === "both");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, lane, interests, assessment: lane === "orgs" ? a : null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong. Please try again or email us.");
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sent) {
    return (
      <div className="boxed stack" style={{ gap: 16 }} role="status">
        <p className="eyebrow">Received</p>
        <h2 style={{ textTransform: "none", letterSpacing: 0 }}>Thank you, {firstName(f.name) || "friend"}.</h2>
        <p>We will review what you shared and be in touch within two business days. If you would like to talk sooner, grab a time on the calendar.</p>
        <div><a className="btn btn-primary" {...(isExternal(bookingUrl) ? { href: bookingUrl, target: "_blank", rel: "noopener noreferrer" } : { href: `${bookingUrl}?name=${encodeURIComponent(f.name)}&email=${encodeURIComponent(f.email)}&lane=${lane}` })}>Book a free consult</a></div>
      </div>
    );
  }

  const check = (label: string, on: boolean, onChange: () => void) => (
    <label key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10, fontWeight: 400 }}>
      <input type="checkbox" checked={on} onChange={onChange} style={{ width: 18, height: 18, accentColor: "var(--rust)" }} />
      {label}
    </label>
  );
  const radio = (name: string, label: string, on: boolean, onChange: () => void) => (
    <label key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10, fontWeight: 400 }}>
      <input type="radio" name={name} checked={on} onChange={onChange} style={{ width: 18, height: 18, accentColor: "var(--rust)" }} />
      {label}
    </label>
  );

  return (
    <form className="card stack" style={{ gap: 28, padding: "clamp(22px, 4vw, 40px)" }} onSubmit={submit}>
      <fieldset className="form-section">
        <legend>I&rsquo;m reaching out for</legend>
        <div className="stack" style={{ gap: 8 }}>
          {radio("lane", "A mental health practice or helping organization", lane === "orgs", () => setLane("orgs"))}
          {radio("lane", "A business, community organization, or event", lane === "business", () => setLane("business"))}
          {radio("lane", "Something else (speaking, partnerships, a workshop)", lane === "other", () => setLane("other"))}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>About you</legend>
        <div className="grid-2" style={{ gap: 14 }}>
          <label>Your name<input type="text" required value={f.name} onChange={set("name")} autoComplete="name" /></label>
          <label>Email<input type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
          <label>Phone <span className="hint">optional</span><input type="text" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
          <label>Organization or business<input type="text" value={f.organization} onChange={set("organization")} autoComplete="organization" /></label>
          <label>Your role<input type="text" placeholder={lane === "orgs" ? "Executive director, practice owner..." : "Founder, director..."} value={f.role} onChange={set("role")} /></label>
          <label>Website or Instagram <span className="hint">optional</span><input type="text" value={f.website} onChange={set("website")} /></label>
        </div>
        <label className="hp" aria-hidden="true">Leave this empty<input type="text" tabIndex={-1} autoComplete="off" value={f.company_url} onChange={set("company_url")} /></label>
      </fieldset>

      <fieldset className="form-section">
        <legend>What you&rsquo;re looking for</legend>
        {shownServices.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 600 }}>What are you interested in?</span>
            <div className="checks" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {shownServices.map((s) => check(s.name, interests.includes(s.id), () => setInterests(toggle(interests, s.id))))}
            </div>
          </div>
        )}
        <label>What would you like to accomplish?<textarea value={f.goals} onChange={set("goals")} /></label>
        <label>What feels hardest right now?<textarea value={f.challenges} onChange={set("challenges")} /></label>
        <div className="grid-2" style={{ gap: 14 }}>
          <label>
            Budget range
            <select value={f.budget} onChange={set("budget")}>
              <option value="">Choose one</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label>
            Timeline
            <select value={f.timeline} onChange={set("timeline")}>
              <option value="">Choose one</option>
              {TIMELINES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      {lane === "orgs" && (
        <fieldset className="form-section">
          <legend>Organizational snapshot</legend>
          <p className="small muted">Optional, but it helps us come to your consult prepared. Share only what you are comfortable sharing, and please leave out any client information.</p>
          <div className="grid-3" style={{ gap: 14 }}>
            <label>Direct-service staff<input type="number" min={0} value={a.staffLicensed} onChange={(e) => setA({ ...a, staffLicensed: e.target.value })} /></label>
            <label>Interns &amp; trainees<input type="number" min={0} value={a.staffInterns} onChange={(e) => setA({ ...a, staffInterns: e.target.value })} /></label>
            <label>Admin &amp; support staff<input type="number" min={0} value={a.staffAdmin} onChange={(e) => setA({ ...a, staffAdmin: e.target.value })} /></label>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 600 }}>Type of organization</span>
            <div className="checks" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {SERVICE_AREAS.map((x) => check(x, a.serviceAreas.includes(x), () => setA({ ...a, serviceAreas: toggle(a.serviceAreas, x) })))}
            </div>
          </div>
          <label style={{ maxWidth: 420 }}>
            How emotionally heavy is your team&rsquo;s day-to-day work? <span className="hint">1 = light, 10 = extremely heavy</span>
            <select value={a.caseIntensity} onChange={(e) => setA({ ...a, caseIntensity: e.target.value })}>
              <option value="">Choose</option>
              {Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <div className="stack" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 600 }}>Signs of strain you are noticing</span>
            <div className="checks">{FATIGUE_SIGNS.map((x) => check(x, a.fatigueSigns.includes(x), () => setA({ ...a, fatigueSigns: toggle(a.fatigueSigns, x) })))}</div>
          </div>
          <label>What happens now when a team member has an especially hard day or situation at work?<textarea value={a.crisisProtocol} onChange={(e) => setA({ ...a, crisisProtocol: e.target.value })} /></label>
          <label style={{ maxWidth: 420 }}>Weekly direct-service hours per full-time staff<input type="text" value={a.billableHours} onChange={(e) => setA({ ...a, billableHours: e.target.value })} /></label>
          <div className="grid-2" style={{ gap: 20 }}>
            <div className="stack" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 600 }}>How is transition or decompression time handled?</span>
              {DECOMPRESSION.map((x) => radio("decomp", x, a.decompression === x, () => setA({ ...a, decompression: x })))}
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 600 }}>How do team members get support from each other and leadership?</span>
              {SUPERVISION.map((x) => radio("sup", x, a.supervision === x, () => setA({ ...a, supervision: x })))}
            </div>
          </div>
          <label>Where does your business model conflict most with staff well-being?<textarea value={a.modelConflict} onChange={(e) => setA({ ...a, modelConflict: e.target.value })} /></label>
          <div className="stack" style={{ gap: 8 }}>
            <span className="small" style={{ fontWeight: 600 }}>Most important outcomes</span>
            <div className="checks">{OUTCOMES.map((x) => check(x, a.outcomes.includes(x), () => setA({ ...a, outcomes: toggle(a.outcomes, x) })))}</div>
          </div>
          <label>Are there cultural or identity dynamics on your team or in your community we should understand and honor?<textarea value={a.identityDynamics} onChange={(e) => setA({ ...a, identityDynamics: e.target.value })} /></label>
        </fieldset>
      )}

      <fieldset className="form-section">
        <legend>Last thing</legend>
        <label style={{ maxWidth: 420 }}>How did you hear about us? <span className="hint">optional</span><input type="text" value={f.heardFrom} onChange={set("heardFrom")} /></label>
      </fieldset>

      {err && <p className="error-text" role="alert">{err}</p>}
      <div className="row">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Sending..." : "Send inquiry"}</button>
        <span className="small muted">We reply within two business days.</span>
      </div>
    </form>
  );
}
