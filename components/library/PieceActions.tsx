"use client";

import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/course/LessonWorkbook";
import type { Prompt } from "@/lib/course-types";

type Answers = Record<string, unknown>;

export default function PieceActions({ pieceId, prompts, initial, done, preview, nextHref, nextLabel }: {
  pieceId: string; prompts: Prompt[]; initial: Answers; done: boolean; preview: boolean; nextHref: string; nextLabel: string;
}) {
  const [a, setA] = useState<Answers>(initial);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const [isDone, setIsDone] = useState(done);
  const pending = useRef<Answers>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function flush() {
    const body = pending.current;
    if (!Object.keys(body).length || preview) return;
    pending.current = {};
    setStatus("saving");
    const res = await fetch("/api/library/answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pieceId, answers: body }), keepalive: true });
    if (!res.ok) {
      pending.current = { ...body, ...pending.current };
      setStatus("error");
    } else setStatus(Object.keys(pending.current).length ? "saving" : "saved");
  }

  function set(id: string, v: unknown) {
    setA((prev) => ({ ...prev, [id]: v }));
    if (preview) return;
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

  async function toggleDone() {
    if (timer.current) clearTimeout(timer.current);
    await flush();
    const next = !isDone;
    setIsDone(next);
    await fetch("/api/library/done", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pieceId, done: next }) });
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      {prompts.length > 0 && (
        <section className="card stack" style={{ gap: 22 }}>
          <div className="row between">
            <span className="eyebrow">Your reflections</span>
            <span className={`tiny ${status === "error" ? "error-text" : "muted"} no-print`} role="status">
              {preview ? "Preview: not saved" : status === "saving" ? "Saving..." : status === "saved" ? "Saved privately" : status === "error" ? "Not saved, check your connection" : "Private. Saves as you type."}
            </span>
          </div>
          {prompts.map((p) => <Field key={p.id} p={p} value={a[p.id]} onChange={(v) => set(p.id, v)} />)}
        </section>
      )}
      <div className="row no-print">
        {isDone ? (
          <>
            <span className="tag green">Done</span>
            <a className="btn btn-primary" href={nextHref}>{nextLabel}</a>
            <button type="button" className="linkbtn small" onClick={toggleDone}>Mark as not done</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={toggleDone}>Mark as done</button>
            <a className="btn btn-ghost" href={nextHref}>{nextLabel}</a>
          </>
        )}
      </div>
    </div>
  );
}
