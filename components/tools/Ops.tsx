"use client";

import { useState } from "react";
import { AGREEMENT_PROMPTS, ONBOARDING_DEFAULT } from "@/lib/tools-def";
import { Area, Choice, Lines, Txt, day, uid, type ToolProps } from "./bits";

/** A list of saved items with one open at a time */
function useOpen(first: string) { return useState(first); }

/* ---------- SOP Builder ---------- */
type Sop = { id: string; title: string; owner: string; when: string; tools: string; steps: string[]; notes: string; updated: string };
type SD = { sops: Sop[] } | null;

export function SopBuilder({ data, set, ro, today }: ToolProps<SD>) {
  const list = data?.sops ?? [];
  const [openId, setOpenId] = useOpen("");
  const save = (sops: Sop[]) => set({ sops });
  const cur = list.find((s) => s.id === openId) ?? null;
  const upCur = (p: Partial<Sop>) => cur && save(list.map((s) => (s.id === cur.id ? { ...s, ...p, updated: today } : s)));
  function add() { const s: Sop = { id: uid(), title: "", owner: "", when: "", tools: "", steps: ["", "", ""], notes: "", updated: today }; save([...list, s]); setOpenId(s.id); }
  return (
    <div className="stack" style={{ gap: 18 }}>
      {!cur && (
        <section className="card stack" style={{ gap: 10 }}>
          <p style={{ margin: 0 }}>An SOP (standard operating procedure) is a short recipe for a task you repeat. Start with the one task only you know how to do.</p>
          {list.map((s) => (
            <button key={s.id} type="button" className="fin-todo" onClick={() => setOpenId(s.id)}>
              <span><strong>{s.title || "Untitled SOP"}</strong>{s.owner && <span className="small muted"> · {s.owner}</span>}</span>
              <span className="small muted">{s.steps.filter(Boolean).length} steps · updated {day(s.updated)}</span>
            </button>
          ))}
          {!ro && <div className="no-print"><button type="button" className="btn btn-primary btn-sm" onClick={add}>+ New SOP</button></div>}
        </section>
      )}
      {cur && (
        <section className="card stack" style={{ gap: 12 }}>
          <div className="row between no-print" style={{ gap: 10 }}><button type="button" className="linkbtn small" onClick={() => setOpenId("")}>&larr; All SOPs</button>{!ro && <button type="button" className="linkbtn small" onClick={() => { if (confirm("Delete this SOP?")) { save(list.filter((s) => s.id !== cur.id)); setOpenId(""); } }}>Delete</button>}</div>
          <Txt label="Task name" value={cur.title} onChange={(v) => upCur({ title: v })} ro={ro} placeholder="Sending a new client their welcome packet" />
          <div className="tl-grid">
            <Txt label="Who does it" value={cur.owner} onChange={(v) => upCur({ owner: v })} ro={ro} placeholder="Assistant" />
            <Txt label="When it happens" value={cur.when} onChange={(v) => upCur({ when: v })} ro={ro} placeholder="Within 1 business day of a signed agreement" />
            <Txt label="Tools or logins needed" value={cur.tools} onChange={(v) => upCur({ tools: v })} ro={ro} placeholder="Email, client portal, Canva" />
          </div>
          <Lines label="Steps" hint="One action per line, in order" items={cur.steps} onChange={(v) => upCur({ steps: v })} ro={ro} placeholder="Open the client's portal and copy their access code" />
          <Area label="Watch-outs and tips" rows={3} value={cur.notes} onChange={(v) => upCur({ notes: v })} ro={ro} placeholder="If they haven't paid, send the invoice reminder first." />
        </section>
      )}
    </div>
  );
}

/* ---------- Client Onboarding Checklist ---------- */
type Run = { id: string; client: string; started: string; done: number[] };
type OD = { steps: string[]; runs: Run[] } | null;

export function Onboarding({ data, set, ro, today }: ToolProps<OD>) {
  const steps = data?.steps ?? ONBOARDING_DEFAULT;
  const runs = data?.runs ?? [];
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  const save = (p: Partial<{ steps: string[]; runs: Run[] }>) => set({ steps, runs, ...p });
  const live = steps.map((s, i) => [s, i] as const).filter(([s]) => s.trim());
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card stack" style={{ gap: 10 }}>
        <div className="row between" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Your onboarding steps</h3>
          {!ro && <button type="button" className="btn btn-sm btn-ghost no-print" onClick={() => setEdit(!edit)}>{edit ? "Done editing" : "Edit steps"}</button>}
        </div>
        {edit ? <Lines label="Steps" items={steps} onChange={(v) => save({ steps: v })} /> : (
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{live.map(([s, i]) => <li key={i}>{s}</li>)}</ol>
        )}
      </section>
      <section className="card stack" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Clients in onboarding</h3>
        {!ro && (
          <form className="row no-print" style={{ gap: 8, flexWrap: "wrap" }} onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; save({ runs: [{ id: uid(), client: name.trim(), started: today, done: [] }, ...runs].slice(0, 60) }); setName(""); }}>
            <input type="text" aria-label="New client's name" placeholder="New client's name" value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 300 }} />
            <button className="btn btn-sm btn-primary">Start their checklist</button>
          </form>
        )}
        {runs.length === 0 && <p className="small muted" style={{ margin: 0 }}>When someone says yes, add them here and check off each step.</p>}
        {runs.map((r) => {
          const n = live.filter(([, i]) => r.done.includes(i)).length;
          return (
            <details key={r.id} className="tl-run" open={n < live.length}>
              <summary><strong>{r.client}</strong> <span className="small muted">· started {day(r.started)} · {n} of {live.length} done</span></summary>
              <div className="stack" style={{ gap: 6, marginTop: 8 }}>
                {live.map(([s, i]) => (
                  <label key={i} className="row small" style={{ gap: 8, flexWrap: "nowrap", alignItems: "flex-start" }}>
                    <input type="checkbox" style={{ width: "auto", marginTop: 4 }} disabled={ro} checked={r.done.includes(i)} onChange={(e) => save({ runs: runs.map((x) => (x.id === r.id ? { ...x, done: e.target.checked ? [...x.done, i] : x.done.filter((y) => y !== i) } : x)) })} />
                    <span className={r.done.includes(i) ? "tl-done" : ""}>{s}</span>
                  </label>
                ))}
                {!ro && <div className="no-print"><button type="button" className="linkbtn small" onClick={() => confirm(`Remove ${r.client}'s checklist?`) && save({ runs: runs.filter((x) => x.id !== r.id) })}>Remove</button></div>}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

/* ---------- Role Clarity Cards ---------- */
type Role = { id: string; title: string; person: string; purpose: string; owns: string[]; decides: string[]; handsOff: string[]; measures: string };
type RD = { roles: Role[] } | null;

export function Roles({ data, set, ro }: ToolProps<RD>) {
  const roles = data?.roles ?? [];
  const save = (r: Role[]) => set({ roles: r });
  const up = (id: string, p: Partial<Role>) => save(roles.map((r) => (r.id === id ? { ...r, ...p } : r)));
  return (
    <div className="stack" style={{ gap: 18 }}>
      <p className="small muted" style={{ margin: 0 }}>One card per role, not per person. One person can hold several roles, especially in a small business. Start with your own.</p>
      {roles.map((r) => (
        <section key={r.id} className="card stack tl-role" style={{ gap: 10 }}>
          <div className="tl-grid">
            <Txt label="Role" value={r.title} onChange={(v) => up(r.id, { title: v })} ro={ro} placeholder="Client Care Coordinator" />
            <Txt label="Who holds it now" value={r.person} onChange={(v) => up(r.id, { person: v })} ro={ro} />
          </div>
          <Txt label="Why this role exists, in one sentence" value={r.purpose} onChange={(v) => up(r.id, { purpose: v })} ro={ro} placeholder="So every client feels taken care of from first call to last session." />
          <div className="tl-cols">
            <Lines label="Owns" hint="Results this role is responsible for" items={r.owns} onChange={(v) => up(r.id, { owns: v })} ro={ro} />
            <Lines label="Decides" hint="Without asking anyone" items={r.decides} onChange={(v) => up(r.id, { decides: v })} ro={ro} />
            <Lines label="Hands off" hint="To whom, and when" items={r.handsOff} onChange={(v) => up(r.id, { handsOff: v })} ro={ro} />
          </div>
          <Txt label="How we know it's going well" value={r.measures} onChange={(v) => up(r.id, { measures: v })} ro={ro} placeholder="Every inquiry answered within 1 business day" />
          {!ro && <div className="no-print"><button type="button" className="linkbtn small" onClick={() => confirm("Remove this role card?") && save(roles.filter((x) => x.id !== r.id))}>Remove this card</button></div>}
        </section>
      ))}
      {!ro && <div className="no-print"><button type="button" className="btn btn-primary btn-sm" onClick={() => save([...roles, { id: uid(), title: "", person: "", purpose: "", owns: [""], decides: [""], handsOff: [""], measures: "" }])}>+ Add a role card</button></div>}
    </div>
  );
}

/* ---------- Team Agreements ---------- */
type AD = { team: string; sections: Record<string, string>; reviewed: string } | null;

export function Agreements({ data, set, ro, today }: ToolProps<AD>) {
  const d = { team: "", sections: {} as Record<string, string>, reviewed: "", ...(data ?? {}) };
  const up = (p: Partial<typeof d>) => set({ ...d, ...p });
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card stack" style={{ gap: 10 }}>
        <Txt label="Team name" value={d.team} onChange={(v) => up({ team: v })} ro={ro} placeholder="The Greene Counseling team" />
        <p className="small muted" style={{ margin: 0 }}>Write these together with your team, not for them. Agreements people help write are the ones they keep. Use the examples as a starting point, and change every word that doesn&rsquo;t sound like you.</p>
      </section>
      {AGREEMENT_PROMPTS.map((p) => (
        <section key={p.id} className="card stack" style={{ gap: 8 }}>
          <h3 style={{ margin: 0 }}>{p.title}</h3>
          <span className="small muted">{p.prompt}</span>
          <textarea aria-label={p.title} rows={3} value={d.sections[p.id] ?? ""} placeholder={p.example} readOnly={ro} onChange={(e) => up({ sections: { ...d.sections, [p.id]: e.target.value } })} />
          {!ro && !d.sections[p.id] && <div className="no-print"><button type="button" className="linkbtn small" onClick={() => up({ sections: { ...d.sections, [p.id]: p.example } })}>Use the example</button></div>}
        </section>
      ))}
      <section className="card row between" style={{ gap: 10, flexWrap: "wrap" }}>
        <span className="small">{d.reviewed ? `Last reviewed together on ${day(d.reviewed)}.` : "Review these with your team every few months."}</span>
        {!ro && <button type="button" className="btn btn-sm btn-ghost no-print" onClick={() => up({ reviewed: today })}>We reviewed these today</button>}
      </section>
    </div>
  );
}

/* ---------- Conversation Planner (hard conversations and everyday feedback) ---------- */
type Conv = { id: string; kind: "hard" | "feedback"; who: string; date: string; f: Record<string, string> };
type VD = { plans: Conv[] } | null;
const HARD: [string, string, string][] = [
  ["issue", "The issue in one neutral sentence", "The last three reports came in after the deadline."],
  ["need", "What I need", "Reports by Friday at noon, or a heads-up by Wednesday if that won't happen."],
  ["theyNeed", "What they likely need", "To feel respected, and maybe help with their workload."],
  ["opening", "My opening line", "I want to talk about something that matters to me, and I want to hear your side too."],
  ["check", "A question to check my story", "Is there something going on that I don't know about?"],
  ["heated", "If it gets heated, I will...", "Pause, breathe, and say: let's take five minutes and come back."],
  ["walkaway", "My walk-away point", "If nothing changes in two weeks, we'll talk about shifting their role."],
];
const FEED: [string, string, string][] = [
  ["situation", "Situation: when and where", "In Tuesday's team meeting"],
  ["behavior", "Behavior: what you saw or heard, not what you assume", "you interrupted Maya twice while she was presenting"],
  ["impact", "Impact: the effect it had", "she stopped sharing, and we missed her ideas"],
  ["ask", "Ask: what you'd like going forward", "Let people finish, and jot your thoughts down to share after"],
  ["checkin", "Check-in question", "How does that land for you?"],
];

export function Conversation({ data, set, ro, today }: ToolProps<VD>) {
  const plans = data?.plans ?? [];
  const [openId, setOpenId] = useState("");
  const save = (p: Conv[]) => set({ plans: p });
  const cur = plans.find((p) => p.id === openId) ?? null;
  const upCur = (p: Partial<Conv>) => cur && save(plans.map((x) => (x.id === cur.id ? { ...x, ...p } : x)));
  function add(kind: Conv["kind"]) { const c: Conv = { id: uid(), kind, who: "", date: today, f: {} }; save([c, ...plans].slice(0, 100)); setOpenId(c.id); }
  const fields = cur?.kind === "feedback" ? FEED : HARD;
  const script = cur?.kind === "feedback" && cur.f.situation && cur.f.behavior && cur.f.impact
    ? `"${cur.f.situation}, ${cur.f.behavior}. ${cur.f.impact.charAt(0).toUpperCase() + cur.f.impact.slice(1)}.${cur.f.ask ? ` Going forward, I'd like to ask: ${cur.f.ask}.` : ""}${cur.f.checkin ? ` ${cur.f.checkin}` : ""}"` : "";
  return (
    <div className="stack" style={{ gap: 18 }}>
      {!cur && (
        <section className="card stack" style={{ gap: 10 }}>
          <p style={{ margin: 0 }}>Plan the conversation before you walk in. Use <strong>Hard conversation</strong> for something you&rsquo;ve been putting off, and <strong>Feedback</strong> for everyday, in-the-moment notes.</p>
          {!ro && <div className="row no-print" style={{ gap: 8 }}><button type="button" className="btn btn-primary btn-sm" onClick={() => add("hard")}>+ Hard conversation</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => add("feedback")}>+ Feedback</button></div>}
          {plans.map((p) => (
            <button key={p.id} type="button" className="fin-todo" onClick={() => setOpenId(p.id)}>
              <span><strong>{p.who || "Untitled"}</strong> <span className="small muted">· {p.kind === "hard" ? "Hard conversation" : "Feedback"}</span></span>
              <span className="small muted">{day(p.date)}</span>
            </button>
          ))}
        </section>
      )}
      {cur && (
        <section className="card stack" style={{ gap: 12 }}>
          <div className="row between no-print" style={{ gap: 10 }}><button type="button" className="linkbtn small" onClick={() => setOpenId("")}>&larr; All conversations</button>{!ro && <button type="button" className="linkbtn small" onClick={() => { if (confirm("Delete this plan?")) { save(plans.filter((x) => x.id !== cur.id)); setOpenId(""); } }}>Delete</button>}</div>
          <Choice label="Type" value={cur.kind} options={[["hard", "Hard conversation"], ["feedback", "Feedback"]]} onChange={(k) => upCur({ kind: k as Conv["kind"] })} ro={ro} />
          <div className="tl-grid">
            <Txt label="With whom" value={cur.who} onChange={(v) => upCur({ who: v })} ro={ro} />
            <label>When<input type="date" value={cur.date} readOnly={ro} onChange={(e) => upCur({ date: e.target.value })} /></label>
          </div>
          {fields.map(([k, l, ex]) => <Area key={k} label={l} rows={2} value={cur.f[k] ?? ""} placeholder={ex} onChange={(v) => upCur({ f: { ...cur.f, [k]: v } })} ro={ro} />)}
          {script && <div className="ev-result stack" style={{ gap: 4 }}><span className="eyebrow" style={{ fontSize: "0.75rem" }}>Your feedback, all together</span><p style={{ margin: 0 }}>{script}</p></div>}
          <Area label="How it went" hint="Fill in after" rows={2} value={cur.f.after ?? ""} onChange={(v) => upCur({ f: { ...cur.f, after: v } })} ro={ro} />
        </section>
      )}
    </div>
  );
}
