"use client";

import { useState } from "react";
import { CHECK_AREAS } from "@/lib/tools-def";
import { day, type ToolProps } from "./bits";

type Entry = { date: string; scores: Record<string, number>; note: string };
type D = { entries: Entry[] } | null;

/** A check-in that saves each time you take it, and shows how it has changed */
function Tracker({ areasKey, data, set, ro, today, intro }: ToolProps<D> & { areasKey: string; intro: string }) {
  const areas = CHECK_AREAS[areasKey];
  const entries = data?.entries ?? [];
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const done = areas.every((a) => draft[a.id]);
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const low = latest ? [...areas].sort((a, b) => latest.scores[a.id] - latest.scores[b.id])[0] : null;
  const avg = (e: Entry) => areas.reduce((n, a) => n + (e.scores[a.id] || 0), 0) / areas.length;

  function save() {
    const e: Entry = { date: today, scores: draft, note };
    const rest = entries.filter((x) => x.date !== today);
    set({ entries: [...rest, e].sort((a, b) => a.date.localeCompare(b.date)).slice(-36) });
    setDraft({}); setNote("");
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      {!ro && (
        <section className="card stack" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 2 }}>
            <h3 style={{ margin: 0 }}>{entries.length ? "Check in again" : "Take it now"}</h3>
            <span className="small muted">{intro}</span>
          </div>
          {areas.map((a) => (
            <fieldset key={a.id} className="ev-q tl-q">
              <legend><strong>{a.area}.</strong> {a.statement}</legend>
              <div className="ev-scale" role="radiogroup" aria-label={a.area}>
                {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={draft[a.id] === n} className={draft[a.id] === n ? "on" : ""} onClick={() => setDraft({ ...draft, [a.id]: n })}>{n}</button>)}
              </div>
            </fieldset>
          ))}
          <label>A note for future you <span className="hint">Optional</span><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's going on this month?" /></label>
          <div><button type="button" className="btn btn-primary btn-sm" disabled={!done} onClick={save}>Save this check-in</button></div>
        </section>
      )}
      {latest && low && (
        <section className="card stack" style={{ gap: 6 }}>
          <span className="eyebrow" style={{ fontSize: "0.75rem" }}>Your growing edge, {day(latest.date)}</span>
          <strong style={{ fontSize: "1.3rem" }}>{low.area}</strong>
          <p style={{ margin: 0 }}>One small step: {low.step}</p>
        </section>
      )}
      {entries.length > 0 && (
        <section className="card stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Over time</h3>
          {entries.length > 1 && first && latest && <p className="small" style={{ margin: 0 }}>Average {avg(first).toFixed(1)} on {day(first.date)} → <strong>{avg(latest).toFixed(1)}</strong> on {day(latest.date)}.</p>}
          <div style={{ overflowX: "auto" }}>
            <table className="fin-table tl-table">
              <thead><tr><th>Date</th>{areas.map((a) => <th key={a.id}>{a.area}</th>)}<th>Note</th></tr></thead>
              <tbody>{[...entries].reverse().map((e) => (
                <tr key={e.date}><td>{day(e.date)}</td>{areas.map((a) => <td key={a.id}><span className={`tl-score s${e.scores[a.id]}`}>{e.scores[a.id]}</span></td>)}<td className="small" style={{ textAlign: "left" }}>{e.note}</td></tr>
              ))}</tbody>
            </table>
          </div>
          {!ro && <p className="tiny muted" style={{ margin: 0 }}>Taking it again on the same day replaces that day&rsquo;s check-in. Once a month is a good rhythm.</p>}
        </section>
      )}
    </div>
  );
}

export const BloomCheck = (p: ToolProps<D>) => <Tracker {...p} areasKey="bloom-check" intro="Rate each from 1 (not yet) to 5 (yes, this is me). Your lowest score is your growing edge." />;
export const CapacityCheck = (p: ToolProps<D>) => (
  <div className="stack" style={{ gap: 12 }}>
    <Tracker {...p} areasKey="capacity-check" intro="Rate each from 1 (not at all) to 5 (very true right now). A reflection tool, not a diagnosis." />
    <p className="tiny muted" style={{ margin: 0 }}>If your scores keep dropping, or you feel hopeless, numb, or unsafe, reach out to your own therapist or doctor. In a crisis, call or text 988.</p>
  </div>
);
