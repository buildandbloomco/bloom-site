"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prompt } from "@/lib/course-types";

type Answers = Record<string, unknown>;

export default function LessonWorkbook({
  eid, lessonId, prompts, initial, done, nextHref, nextLabel,
}: {
  eid: string; lessonId: string; prompts: Prompt[]; initial: Answers; done: boolean; nextHref: string; nextLabel: string;
}) {
  const router = useRouter();
  const [a, setA] = useState<Answers>(initial);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const [isDone, setIsDone] = useState(done);
  const [busy, setBusy] = useState(false);
  const pending = useRef<Answers>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function flush() {
    const body = pending.current;
    if (!Object.keys(body).length) return;
    pending.current = {};
    setStatus("saving");
    const res = await fetch(`/api/learn/${eid}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: body }), keepalive: true });
    if (!res.ok) {
      pending.current = { ...body, ...pending.current };
      setStatus("error");
    } else setStatus(Object.keys(pending.current).length ? "saving" : "saved");
  }

  function set(id: string, v: unknown) {
    setA((prev) => ({ ...prev, [id]: v }));
    pending.current[id] = v;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }

  useEffect(() => {
    const onHide = () => { if (Object.keys(pending.current).length) void flush(); };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  });

  async function complete() {
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    await flush();
    await fetch(`/api/learn/${eid}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, done: true }) });
    setIsDone(true);
    router.push(nextHref);
    router.refresh();
  }

  async function undo() {
    await fetch(`/api/learn/${eid}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, done: false }) });
    setIsDone(false);
    router.refresh();
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      {prompts.length > 0 && (
        <section className="card stack" style={{ gap: 24 }}>
          <div className="row between">
            <span className="eyebrow">Your workbook</span>
            <span className={`tiny ${status === "error" ? "error-text" : "muted"}`} role="status">
              {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : status === "error" ? "Not saved, check your connection" : "Saves as you type"}
            </span>
          </div>
          {prompts.map((p) => <Field key={p.id} p={p} value={a[p.id]} onChange={(v) => set(p.id, v)} />)}
        </section>
      )}
      <div className="row">
        {isDone ? (
          <>
            <span className="tag green">Lesson complete</span>
            <a className="btn btn-primary" href={nextHref}>{nextLabel}</a>
            <button type="button" className="linkbtn small" onClick={undo}>Mark as not done</button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={complete} disabled={busy}>{busy ? "Saving..." : "Mark complete & continue"}</button>
        )}
      </div>
    </div>
  );
}

export function Field({ p, value, onChange }: { p: Prompt; value: unknown; onChange: (v: unknown) => void }) {
  const id = `q-${p.id}`;
  const help = p.help && (
    p.help.startsWith("Journal") ? <p className="eyebrow">{p.help}</p> : <p className="q-help">{p.help}</p>
  );
  if (p.type === "table") {
    const labelCol = p.rows.length > 0;
    const rows = labelCol ? p.rows : Array.from({ length: p.blankRows || 3 }, () => "");
    const cols = labelCol ? p.columns.slice(1) : p.columns;
    const grid = (Array.isArray(value) ? value : []) as string[][];
    const setCell = (r: number, c: number, v: string) => {
      const g = rows.map((_, ri) => cols.map((__, ci) => grid[ri]?.[ci] ?? ""));
      g[r][c] = v;
      onChange(g);
    };
    return (
      <div className="stack" style={{ gap: 8 }}>
        <p className="q-label">{p.label}</p>
        {help}
        <div className="table-wrap">
          <table className="wb-table">
            <thead><tr>{labelCol && <th>{p.columns[0] || ""}</th>}{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {labelCol && <th scope="row">{r}</th>}
                  {cols.map((c, ci) => (
                    <td key={ci} style={{ padding: 0 }}>
                      <textarea aria-label={`${r || `Row ${ri + 1}`} ${c}`} className="cell-input" value={grid[ri]?.[ci] ?? ""} onChange={(x) => setCell(ri, ci, x.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (p.type === "checklist") {
    const checked = (Array.isArray(value) ? value : []) as string[];
    return (
      <fieldset className="form-section">
        <legend className="q-label" style={{ fontFamily: "var(--serif)", textTransform: "none", letterSpacing: 0, color: "var(--ink)" }}>{p.label}</legend>
        {help}
        <div className="checks">
          {p.options.map((o) => (
            <label key={o}><input type="checkbox" checked={checked.includes(o)} onChange={() => onChange(checked.includes(o) ? checked.filter((x) => x !== o) : [...checked, o])} /> {o}</label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (p.type === "scale") {
    return (
      <div className="stack" style={{ gap: 6 }}>
        <label htmlFor={id} className="q-label">{p.label}</label>
        {help}
        <div className="row" role="radiogroup" aria-label={p.label} style={{ gap: 6 }}>
          {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={value === n} className={`btn btn-sm ${value === n ? "btn-dark" : "btn-ghost"}`} style={{ minWidth: 44, padding: "6px 10px" }} onClick={() => onChange(n)}>{n}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 6 }}>
      {p.help?.startsWith("Journal") && help}
      <label htmlFor={id} className="q-label">{p.label}</label>
      {!p.help?.startsWith("Journal") && help}
      {p.type === "short" ? (
        <input id={id} type="text" value={(value as string) ?? ""} onChange={(x) => onChange(x.target.value)} />
      ) : (
        <textarea id={id} style={{ minHeight: 140 }} value={(value as string) ?? ""} onChange={(x) => onChange(x.target.value)} />
      )}
    </div>
  );
}
