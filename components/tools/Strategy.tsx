"use client";

import { useState } from "react";
import { RIGHT_YES_QS, rightYesVerdict, usd0 } from "@/lib/tools-def";
import { Area, Choice, Lines, Num, Txt, day, uid, type ToolProps } from "./bits";

const addDays = (d: string, n: number) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/* ---------- 90-Day Priority Planner ---------- */
type Ms = { id: string; text: string; week: number; done: boolean };
type Pr = { id: string; title: string; doneLooks: string; milestones: Ms[] };
type ND = { goal: string; why: string; start: string; priorities: Pr[] } | null;

export function NinetyDay({ data, set, ro, today }: ToolProps<ND>) {
  const d = { goal: "", why: "", start: today, priorities: [] as Pr[], ...(data ?? {}) };
  const pr = d.priorities.length ? d.priorities : [1, 2, 3].map(() => ({ id: uid(), title: "", doneLooks: "", milestones: [] as Ms[] }));
  const up = (p: Partial<typeof d>) => set({ ...d, priorities: pr, ...p });
  const upPr = (id: string, p: Partial<Pr>) => up({ priorities: pr.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const all = pr.flatMap((x) => x.milestones);
  const pct = all.length ? Math.round((all.filter((x) => x.done).length / all.length) * 100) : 0;
  const weekNow = Math.min(13, Math.max(1, Math.floor((new Date(today).getTime() - new Date(d.start).getTime()) / (7 * 864e5)) + 1));
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card stack" style={{ gap: 12 }}>
        <Area label="By the end of these 90 days, I will have..." rows={2} value={d.goal} onChange={(v) => up({ goal: v })} ro={ro} placeholder="Booked 10 new clients and hired a part-time assistant" />
        <Area label="Why it matters" rows={2} value={d.why} onChange={(v) => up({ why: v })} ro={ro} />
        <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ maxWidth: 220 }}>Start date<input type="date" value={d.start} readOnly={ro} onChange={(e) => up({ start: e.target.value })} /></label>
          <span className="small">Ends <strong>{day(addDays(d.start, 90))}</strong> · You&rsquo;re in week <strong>{weekNow}</strong> of 13</span>
        </div>
        {all.length > 0 && <div className="stack" style={{ gap: 4 }}><span className="small">{pct}% of milestones done</span><div className="tl-bar-track"><span style={{ width: `${pct}%` }} /></div></div>}
      </section>
      {pr.map((p, i) => (
        <section key={p.id} className="card stack" style={{ gap: 10 }}>
          <span className="eyebrow" style={{ fontSize: "0.75rem" }}>Priority {i + 1}</span>
          <Txt label="The priority" value={p.title} onChange={(v) => upPr(p.id, { title: v })} ro={ro} placeholder="Fill my calendar with right-fit clients" />
          <Txt label="Done looks like" value={p.doneLooks} onChange={(v) => upPr(p.id, { doneLooks: v })} ro={ro} placeholder="10 signed clients, a waitlist started" />
          <span className="tl-label">Milestones</span>
          {p.milestones.map((m) => (
            <div key={m.id} className="row tl-ms" style={{ gap: 8, flexWrap: "nowrap" }}>
              <input type="checkbox" style={{ width: "auto" }} aria-label="Done" checked={m.done} disabled={ro} onChange={(e) => upPr(p.id, { milestones: p.milestones.map((x) => (x.id === m.id ? { ...x, done: e.target.checked } : x)) })} />
              <select aria-label="Week" value={m.week} disabled={ro} style={{ width: 96 }} onChange={(e) => upPr(p.id, { milestones: p.milestones.map((x) => (x.id === m.id ? { ...x, week: Number(e.target.value) } : x)).sort((a, b) => a.week - b.week) })}>
                {Array.from({ length: 13 }, (_, k) => <option key={k} value={k + 1}>Week {k + 1}</option>)}
              </select>
              <input type="text" aria-label="Milestone" value={m.text} readOnly={ro} className={m.done ? "tl-done" : ""} onChange={(e) => upPr(p.id, { milestones: p.milestones.map((x) => (x.id === m.id ? { ...x, text: e.target.value } : x)) })} />
              {!ro && <button type="button" className="linkbtn small no-print" onClick={() => upPr(p.id, { milestones: p.milestones.filter((x) => x.id !== m.id) })}>Remove</button>}
            </div>
          ))}
          {!ro && <div className="no-print"><button type="button" className="btn btn-sm btn-ghost" onClick={() => upPr(p.id, { milestones: [...p.milestones, { id: uid(), text: "", week: Math.min(13, (p.milestones[p.milestones.length - 1]?.week ?? 0) + 2), done: false }] })}>+ Add a milestone</button></div>}
        </section>
      ))}
      {!ro && pr.length < 5 && <div className="no-print"><button type="button" className="btn btn-sm btn-ghost" onClick={() => up({ priorities: [...pr, { id: uid(), title: "", doneLooks: "", milestones: [] }] })}>+ Add a priority</button> <span className="tiny muted">Three is plenty for most people.</span></div>}
    </div>
  );
}

/* ---------- The Right Yes Decision Filter ---------- */
type Dec = { id: string; title: string; date: string; answers: Record<string, string>; letGo: string; note: string };
type RD = { decisions: Dec[] } | null;

export function RightYes({ data, set, ro, today }: ToolProps<RD>) {
  const list = data?.decisions ?? [];
  const [openId, setOpenId] = useState<string>(list.length ? "" : "new");
  const save = (decisions: Dec[]) => set({ decisions });
  const cur = openId === "new" ? null : list.find((x) => x.id === openId) ?? null;
  function startNew() { const n: Dec = { id: uid(), title: "", date: today, answers: {}, letGo: "", note: "" }; save([n, ...list]); setOpenId(n.id); }
  const upCur = (p: Partial<Dec>) => cur && save(list.map((x) => (x.id === cur.id ? { ...x, ...p } : x)));
  const v = cur ? rightYesVerdict(cur.answers) : null;
  return (
    <div className="stack" style={{ gap: 18 }}>
      {!ro && openId === "new" && !cur && (
        <section className="card stack" style={{ gap: 10 }}>
          <p style={{ margin: 0 }}>Saying yes to the wrong thing is saying no to the right one. Run the opportunity through six questions before you answer.</p>
          <div><button type="button" className="btn btn-primary btn-sm" onClick={startNew}>Start a decision</button></div>
        </section>
      )}
      {cur && (
        <section className="card stack" style={{ gap: 14 }}>
          <Txt label="What are you deciding?" value={cur.title} onChange={(t) => upCur({ title: t })} ro={ro} placeholder="Speaking at a conference in March, unpaid" />
          {RIGHT_YES_QS.map((q) => (
            <Choice key={q.id} label={q.q} value={cur.answers[q.id] || ""} options={[["yes", "Yes"], ["some", "Somewhat"], ["no", "No"]]} onChange={(a) => upCur({ answers: { ...cur.answers, [q.id]: a } })} ro={ro} />
          ))}
          {v && (
            <div className="ev-result stack" style={{ gap: 4 }} role="status">
              <strong style={{ fontSize: "1.25rem" }}>{v.label}</strong>
              <p style={{ margin: 0 }}>{v.note}</p>
            </div>
          )}
          {v?.label === "A right yes" && <Txt label="To make room, I will let go of..." value={cur.letGo} onChange={(t) => upCur({ letGo: t })} ro={ro} />}
          <Area label="Notes" rows={2} value={cur.note} onChange={(t) => upCur({ note: t })} ro={ro} />
          <div className="row no-print" style={{ gap: 10 }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpenId("")}>Done</button>
            {!ro && <button type="button" className="linkbtn small" onClick={() => { if (confirm("Delete this decision?")) { save(list.filter((x) => x.id !== cur.id)); setOpenId(""); } }}>Delete</button>}
          </div>
        </section>
      )}
      {list.length > 0 && (
        <section className="card stack" style={{ gap: 6 }}>
          <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Your decisions</h3>{!ro && <button type="button" className="btn btn-sm btn-primary no-print" onClick={startNew}>+ New decision</button>}</div>
          {list.map((x) => { const vv = rightYesVerdict(x.answers); return (
            <button key={x.id} type="button" className="fin-todo" onClick={() => setOpenId(x.id)}>
              <span><strong>{x.title || "Untitled decision"}</strong> <span className="small muted">· {day(x.date)}</span></span>
              <span className="small">{vv ? vv.label : "Not finished"}</span>
            </button>
          ); })}
        </section>
      )}
      <p className="tiny muted" style={{ margin: 0 }}>Inspired by The Right Yes, a Build &amp; Bloom guide.</p>
    </div>
  );
}

/* ---------- Weekly CEO Review ---------- */
type Rev = { id: string; week: string; moneyIn: number; moneyOut: number; wins: string; clients: string; team: string; stuck: string; next: string[]; energy: number };
type CD = { reviews: Rev[] } | null;
const PROMPTS: [keyof Rev, string, string][] = [
  ["wins", "Wins this week", "Big or small. What went well?"],
  ["clients", "Clients", "Who needs follow-up? Any invoices or proposals out?"],
  ["team", "Team and help", "Who needs support, feedback, or thanks?"],
  ["stuck", "What's stuck", "What did you avoid, and what's in the way?"],
];

export function CeoReview({ data, set, ro, today }: ToolProps<CD>) {
  const list = data?.reviews ?? [];
  const [openId, setOpenId] = useState(list.find((r) => r.week === today)?.id ?? "");
  const save = (reviews: Rev[]) => set({ reviews });
  const cur = list.find((r) => r.id === openId) ?? null;
  const upCur = (p: Partial<Rev>) => cur && save(list.map((r) => (r.id === cur.id ? { ...r, ...p } : r)));
  function startNew() { const r: Rev = { id: uid(), week: today, moneyIn: 0, moneyOut: 0, wins: "", clients: "", team: "", stuck: "", next: ["", "", ""], energy: 0 }; save([r, ...list].slice(0, 104)); setOpenId(r.id); }
  return (
    <div className="stack" style={{ gap: 18 }}>
      {!ro && !cur && (
        <section className="card stack" style={{ gap: 10 }}>
          <p style={{ margin: 0 }}>Every Friday, take 15 minutes to look at the business from above: money, clients, team, and the three things that matter most next week.</p>
          <div><button type="button" className="btn btn-primary btn-sm" onClick={startNew}>Start this week&rsquo;s review</button></div>
        </section>
      )}
      {cur && (
        <section className="card stack" style={{ gap: 14 }}>
          <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Week of {day(cur.week)}</h3><button type="button" className="btn btn-sm btn-ghost no-print" onClick={() => setOpenId("")}>Done</button></div>
          <div className="tl-grid">
            <Num label="Money in this week" prefix="$" value={cur.moneyIn} onChange={(n) => upCur({ moneyIn: n })} ro={ro} />
            <Num label="Money out this week" prefix="$" value={cur.moneyOut} onChange={(n) => upCur({ moneyOut: n })} ro={ro} />
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>Tip: your Money tab shows this month&rsquo;s totals.</p>
          {PROMPTS.map(([k, l, h]) => <Area key={k} label={l} hint={h} rows={2} value={cur[k] as string} onChange={(t) => upCur({ [k]: t } as Partial<Rev>)} ro={ro} />)}
          <Lines label="My top 3 for next week" items={cur.next} onChange={(n) => upCur({ next: n })} ro={ro} />
          <Choice label="My energy this week" value={String(cur.energy || "")} options={[["1", "1 Drained"], ["2", "2"], ["3", "3 Steady"], ["4", "4"], ["5", "5 Full"]]} onChange={(e) => upCur({ energy: Number(e) })} ro={ro} />
        </section>
      )}
      {list.length > 0 && (
        <section className="card stack" style={{ gap: 6 }}>
          <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Past reviews</h3>{!ro && !list.some((r) => r.week === today) && <button type="button" className="btn btn-sm btn-primary no-print" onClick={startNew}>+ This week</button>}</div>
          {list.map((r) => (
            <button key={r.id} type="button" className="fin-todo" onClick={() => setOpenId(r.id)}>
              <span><strong>{day(r.week)}</strong> <span className="small muted">· net {usd0(r.moneyIn - r.moneyOut)}</span></span>
              <span className="small">{r.energy ? `Energy ${r.energy}/5` : ""}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
