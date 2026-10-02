"use client";

import { useState } from "react";
import { DOMAINS, ITEM_COUNT, itemKey, OPEN_QUESTIONS, ROLE_GROUPS, SCALE } from "@/lib/assessment-def";

/** Anonymous team survey, one section per page */
export default function TeamSurvey({ token, org }: { token: string; org: string }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<string[]>(OPEN_QUESTIONS.map(() => ""));
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const answered = Object.keys(answers).length;
  const last = DOMAINS.length + 1;

  async function submit() {
    setSending(true);
    setMsg("");
    const res = await fetch(`/api/assess/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, answers, open }) });
    const d = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) return setMsg(d.error || "Could not submit. Please try again.");
    setDone(true);
    window.scrollTo({ top: 0 });
  }

  if (done) {
    return (
      <div className="ws-card" style={{ alignItems: "flex-start" }}>
        <h3>Thank you.</h3>
        <p style={{ margin: 0 }}>Your answers were sent anonymously. They&rsquo;ll only ever be shown as part of group averages. You can close this page.</p>
      </div>
    );
  }
  const sectionDone = step >= 1 && step <= DOMAINS.length ? DOMAINS[step - 1].items.every((_, i) => answers[itemKey(DOMAINS[step - 1].id, i)]) : true;

  return (
    <div className="ws-card" style={{ gap: 18 }}>
      <div className="stack" style={{ gap: 6 }}>
        <div className="ws-bar" style={{ height: 8 }}><span className="done" style={{ width: `${(answered / ITEM_COUNT) * 100}%` }} /></div>
        <span className="tiny muted">{answered} of {ITEM_COUNT} answered · Part {step + 1} of {last + 1}</span>
      </div>
      {step === 0 && (
        <div className="stack" style={{ gap: 14 }}>
          <h3>Before you start</h3>
          <p style={{ margin: 0 }}>{org ? `${org} has` : "Your organization has"} asked Build &amp; Bloom Collective to look at how your work is set up: workloads, schedules, support, and how it feels to work here. This survey is <strong>anonymous</strong>. We don&rsquo;t collect your name or email, and results are only shared as group averages.</p>
          <p style={{ margin: 0 }}>It takes about 8 minutes. Answer based on your own experience over the last few months.</p>
          <label style={{ maxWidth: 460 }}>Which best describes your role? <span className="hint">optional</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Choose one</option>
              {ROLE_GROUPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
      )}
      {step >= 1 && step <= DOMAINS.length && (() => {
        const d = DOMAINS[step - 1];
        return (
          <div className="as-domain">
            <h3>{d.name}</h3>
            {d.items.map((it, i) => {
              const k = itemKey(d.id, i);
              return (
                <div className="as-item" key={k}>
                  <p>{it}</p>
                  <div className="as-scale" role="radiogroup" aria-label={it}>
                    {SCALE.map((lab, v) => <label key={lab}><input type="radio" name={k} checked={answers[k] === v + 1} onChange={() => setAnswers({ ...answers, [k]: v + 1 })} />{lab}</label>)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      {step === last && (
        <div className="stack" style={{ gap: 14 }}>
          <h3>In your own words</h3>
          <p className="small muted" style={{ margin: 0 }}>Optional. Please leave out names or details that could identify you or others.</p>
          {OPEN_QUESTIONS.map((q, i) => (
            <label key={q}>{q}<textarea value={open[i]} onChange={(e) => setOpen(open.map((x, j) => (j === i ? e.target.value : x)))} /></label>
          ))}
          {answered < ITEM_COUNT && <p className="error-text small" style={{ margin: 0 }}>{ITEM_COUNT - answered} statements still need an answer. Use Back to find them.</p>}
          <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={answered < ITEM_COUNT || sending} onClick={submit}>{sending ? "Sending..." : "Submit anonymously"}</button>
        </div>
      )}
      {msg && <p className="error-text small" role="status" style={{ margin: 0 }}>{msg}</p>}
      <div className="row between">
        <button type="button" className="btn btn-sm btn-ghost" disabled={step === 0} onClick={() => { setStep(step - 1); window.scrollTo({ top: 0 }); }}>&larr; Back</button>
        {step < last && <button type="button" className="btn btn-sm btn-dark" disabled={!sectionDone} onClick={() => { setStep(step + 1); window.scrollTo({ top: 0 }); }}>{step === 0 ? "Start" : "Next"} &rarr;</button>}
      </div>
    </div>
  );
}
