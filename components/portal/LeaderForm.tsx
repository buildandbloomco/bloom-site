"use client";

import { useEffect, useRef, useState } from "react";
import { DOMAINS, ITEM_COUNT, itemKey, OPS_FIELDS, POLICIES, SCALE } from "@/lib/assessment-def";
import type { Assessment } from "@/lib/assessment-types";

type Profile = Assessment["profile"];

/** The leader's questionnaire: about the organization, then the same statements the team answers. Saves as you go. */
export default function LeaderForm({ initial, locked }: { initial: Assessment; locked: boolean }) {
  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [answers, setAnswers] = useState<Record<string, number>>(initial.leaderAnswers);
  const [name, setName] = useState(initial.leaderName);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [submittedAt, setSubmittedAt] = useState(initial.leaderSubmittedAt);
  const [step, setStep] = useState(0);
  const first = useRef(true);
  const answered = Object.keys(answers).length;

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (locked) return;
    setState("saving");
    const t = setTimeout(async () => {
      const res = await fetch("/api/portal/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", profile, answers }) });
      setState(res.ok ? "saved" : "error");
    }, 900);
    return () => clearTimeout(t);
  }, [profile, answers, locked]);

  async function submit() {
    setMsg("");
    const res = await fetch("/api/portal/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", profile, answers, name }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(d.error || "Could not submit.");
    setSubmittedAt(d.leaderSubmittedAt);
    setMsg("Submitted. Thank you! Next, share the team survey link.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const P = (k: keyof Profile, v: string | string[]) => setProfile({ ...profile, [k]: v });
  const steps = ["About your organization", "Operations snapshot", ...DOMAINS.map((d) => d.name), "Review and submit"];

  return (
    <div className="ws-card" style={{ gap: 18 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 2 }}>
          <span className="eyebrow">Leader questionnaire</span>
          <h3>{steps[step]}</h3>
        </div>
        <span className="small muted" role="status">
          {locked ? "Locked while we review" : state === "saving" ? "Saving..." : state === "saved" ? "Saved" : state === "error" ? "Not saved. Check your connection." : ""}
          {submittedAt && !locked ? " · Submitted" : ""}
        </span>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="ws-bar" style={{ height: 8 }}><span className="done" style={{ width: `${(answered / ITEM_COUNT) * 100}%` }} /></div>
        <span className="tiny muted">{answered} of {ITEM_COUNT} statements answered · Step {step + 1} of {steps.length}</span>
      </div>

      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 14 }}>
        {step === 0 && (
          <>
            <div className="grid-2" style={{ gap: 12 }}>
              <label>Organization name<input type="text" value={profile.orgName} onChange={(e) => P("orgName", e.target.value)} /></label>
              <label>Team size <span className="hint">everyone, including part-time</span><input type="text" value={profile.teamSize} onChange={(e) => P("teamSize", e.target.value)} /></label>
            </div>
            <label>Roles on your team <span className="hint">for example: 6 therapists, 2 interns, 1 office manager</span><textarea value={profile.roles} onChange={(e) => P("roles", e.target.value)} /></label>
            <label>What you do and who you serve<textarea value={profile.services} onChange={(e) => P("services", e.target.value)} /></label>
            <div className="stack" style={{ gap: 8 }}>
              <strong className="small">Which of these do you have in place today?</strong>
              <div className="checks">
                {POLICIES.map((x) => (
                  <label key={x}><input type="checkbox" checked={profile.policies.includes(x)} onChange={() => P("policies", profile.policies.includes(x) ? profile.policies.filter((y) => y !== x) : [...profile.policies, x])} /> {x}</label>
                ))}
              </div>
            </div>
            <label>What prompted this assessment? What feels hardest right now?<textarea value={profile.priorities} onChange={(e) => P("priorities", e.target.value)} /></label>
            <label>Any big changes in the last year? <span className="hint">growth, turnover, new services, leadership changes</span><textarea value={profile.recentChanges} onChange={(e) => P("recentChanges", e.target.value)} /></label>
            <label>What would success look like six months from now?<textarea value={profile.success} onChange={(e) => P("success", e.target.value)} /></label>
          </>
        )}
        {step === 1 && (
          <>
            <p className="muted small" style={{ margin: 0 }}>The facts behind the scores. Rough numbers are fine. This is what lets us compare how the work is set up with how your team experiences it.</p>
            {OPS_FIELDS.map((f) => (
              <label key={f.key}>{f.label} <span className="hint">{f.hint}</span><textarea value={profile[f.key] ?? ""} onChange={(e) => P(f.key, e.target.value)} /></label>
            ))}
          </>
        )}
        {step > 1 && step <= DOMAINS.length + 1 && (() => {
          const d = DOMAINS[step - 2];
          return (
            <div className="as-domain">
              <p className="muted small" style={{ margin: "0 0 6px" }}>{d.blurb} Answer the way you believe your team experiences it today.</p>
              {d.items.map((it, i) => {
                const k = itemKey(d.id, i);
                return (
                  <div className="as-item" key={k}>
                    <p>{it}</p>
                    <div className="as-scale" role="radiogroup" aria-label={it}>
                      {SCALE.map((lab, v) => (
                        <label key={lab}><input type="radio" name={k} checked={answers[k] === v + 1} onChange={() => setAnswers({ ...answers, [k]: v + 1 })} />{lab}</label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {step === steps.length - 1 && (
          <div className="stack" style={{ gap: 12 }}>
            {answered < ITEM_COUNT ? (
              <p className="error-text small" style={{ margin: 0 }}>{ITEM_COUNT - answered} statements still need an answer. Use Back to find them.</p>
            ) : (
              <p className="ok-text small" style={{ margin: 0 }}>Every statement is answered.</p>
            )}
            <label style={{ maxWidth: 420 }}>Your name<input type="text" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={answered < ITEM_COUNT || !name.trim()} onClick={submit}>{submittedAt ? "Submit updated answers" : "Submit my answers"}</button>
          </div>
        )}
      </fieldset>
      {msg && <p className={`small ${/Submitted/.test(msg) ? "ok-text" : "error-text"}`} role="status" style={{ margin: 0 }}>{msg}</p>}
      <div className="row between">
        <button type="button" className="btn btn-sm btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>&larr; Back</button>
        {step < steps.length - 1 && <button type="button" className="btn btn-sm btn-dark" onClick={() => setStep(step + 1)}>Next &rarr;</button>}
      </div>
    </div>
  );
}
