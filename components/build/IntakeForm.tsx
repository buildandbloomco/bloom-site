"use client";

import { useEffect, useRef, useState } from "react";
import { accountsFor, intakeProgress, sectionsFor, type Build, type Field } from "@/lib/build-def";

type Val = string | string[];

/** The build questionnaire. The client fills it in from their portal, or you fill it in with them during the consultation. Saves as you type. */
export default function IntakeForm({ initial, as, clientId, onChange }: { initial: Build; as: "client" | "us"; clientId: string; onChange?: (b: Build) => void }) {
  const [b, setB] = useState(initial);
  const [state, setState] = useState("");
  const [open, setOpen] = useState<string>(sectionsFor(initial.kind)[0].id);
  const pending = useRef<Record<string, Val>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const api = as === "client" ? "/api/portal/build" : `/api/admin/clients/${clientId}/build`;

  async function send(body: Record<string, unknown>) {
    const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setState(j.error || "Not saved. Check your connection."); return null; }
    return j as Build;
  }
  async function flush() {
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    const j = await send({ intake: patch });
    if (j) { setState("Saved"); onChange?.(j); } else pending.current = { ...patch, ...pending.current };
  }
  function set(key: string, v: Val) {
    setB((d) => ({ ...d, intake: { ...d.intake, [key]: v } }));
    pending.current[key] = v;
    setState("Saving...");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }
  useEffect(() => {
    const leave = () => { if (Object.keys(pending.current).length) navigator.sendBeacon?.(api, new Blob([JSON.stringify({ intake: pending.current })], { type: "application/json" })); };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [api]);

  const sections = sectionsFor(b.kind);
  const prog = intakeProgress(b);
  const str = (k: string) => (typeof b.intake[k] === "string" ? (b.intake[k] as string) : "");
  const arr = (k: string) => (Array.isArray(b.intake[k]) ? (b.intake[k] as string[]) : []);
  const has = (f: Field) => (f.type === "multi" ? arr(f.key).length > 0 : str(f.key).trim() !== "");

  function input(f: Field) {
    const id = `in-${f.key}`;
    const head = <span>{f.label}{f.hint && <span className="hint"> {f.hint}</span>}</span>;
    if (f.type === "long") return <label key={f.key} htmlFor={id}>{head}<textarea id={id} rows={4} value={str(f.key)} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} /></label>;
    if (f.type === "color") {
      const v = str(f.key);
      return (
        <div key={f.key} className="stack" style={{ gap: 6 }}>
          <label htmlFor={id}>{head}</label>
          <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
            <input id={id} type="color" value={v || "#ffffff"} onChange={(e) => set(f.key, e.target.value)} style={{ width: 56, height: 44, padding: 2 }} />
            <input type="text" aria-label={`${f.label} code`} value={v} placeholder="#854327" maxLength={7} onChange={(e) => set(f.key, e.target.value)} style={{ width: 130 }} />
            {v && <button type="button" className="linkbtn small" onClick={() => set(f.key, "")}>Clear</button>}
          </div>
        </div>
      );
    }
    if (f.type === "choice") return (
      <fieldset key={f.key} className="stack" style={{ gap: 6, border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 6 }}>{head}</legend>
        {f.options!.map((o) => <label key={o} className="row" style={{ gap: 8 }}><input type="radio" name={f.key} style={{ width: "auto" }} checked={str(f.key) === o} onChange={() => set(f.key, o)} /><span>{o}</span></label>)}
      </fieldset>
    );
    if (f.type === "multi") return (
      <fieldset key={f.key} className="stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 6 }}>{head} <span className="hint">Choose all that fit.</span></legend>
        <div className="chip-set">
          {f.options!.map((o) => { const on = arr(f.key).includes(o); return <button type="button" key={o} className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => set(f.key, on ? arr(f.key).filter((x) => x !== o) : [...arr(f.key), o])}>{o}</button>; })}
        </div>
      </fieldset>
    );
    return <label key={f.key} htmlFor={id}>{head}<input id={id} type={f.type === "url" ? "url" : "text"} value={str(f.key)} placeholder={f.placeholder ?? (f.type === "url" ? "https://" : undefined)} onChange={(e) => set(f.key, e.target.value)} /></label>;
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row between" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="stack" style={{ gap: 4, flex: "1 1 240px" }}>
          <span className="small"><strong>{prog.done} of {prog.total}</strong> answered{b.intakeSubmittedAt ? " · Sent to Build & Bloom" : ""}</span>
          <div className="bar sm" aria-hidden="true"><span style={{ width: `${prog.percent}%` }} /></div>
        </div>
        <span className="small muted" role="status">{state || "Saves as you type. Come back any time."}</span>
      </div>
      {sections.map((s) => {
        const done = s.fields.filter(has).length;
        const isOpen = open === s.id;
        return (
          <section className="intake-sec" key={s.id}>
            <button type="button" className="intake-head" aria-expanded={isOpen} onClick={() => { flush(); setOpen(isOpen ? "" : s.id); }}>
              <span><strong>{s.title}</strong><span className="small muted"> {s.intro}</span></span>
              <span className={`tag ${done === s.fields.length ? "green" : ""}`}>{done}/{s.fields.length}</span>
            </button>
            {isOpen && <div className="stack" style={{ gap: 16, padding: "4px 20px 20px" }}>{s.fields.map(input)}</div>}
          </section>
        );
      })}
      {as === "client" && (
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={async () => { await flush(); const j = await send({ submit: true }); if (j) { setB((d) => ({ ...d, intakeSubmittedAt: j.intakeSubmittedAt })); setState("Sent. Thank you! You can still add to it."); } }}>{b.intakeSubmittedAt ? "Send my updates" : "Send to Build & Bloom"}</button>
          <span className="small muted">You do not have to finish in one sitting, and skipped questions are fine. We will cover them together.</span>
        </div>
      )}
    </div>
  );
}

/** The accounts a client sets up in their own name, with what each costs */
export function AccountsList({ initial, as, clientId }: { initial: Build; as: "client" | "us"; clientId: string }) {
  const [acc, setAcc] = useState(initial.accounts);
  const api = as === "client" ? "/api/portal/build" : `/api/admin/clients/${clientId}/build`;
  async function toggle(key: string) {
    const next = acc[key as keyof typeof acc] === "done" ? "todo" : "done";
    setAcc((a) => ({ ...a, [key]: next }));
    await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accounts: { [key]: next } }) });
  }
  return (
    <div>
      {accountsFor(initial.kind).map((a) => (
        <label key={a.key} className="row file-row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "nowrap", justifyContent: "flex-start" }}>
          <input type="checkbox" style={{ width: "auto", marginTop: 5 }} checked={acc[a.key] === "done"} onChange={() => toggle(a.key)} />
          <span className="stack" style={{ gap: 2 }}>
            <span><strong>{a.label}</strong> <span className="small muted">· {a.cost}</span></span>
            <span className="small">{a.why} {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Open</a>}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
