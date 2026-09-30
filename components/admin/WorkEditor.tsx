"use client";

import { useState } from "react";
import type { Client, Deliverable, DeliverableType } from "@/lib/types";
import { computeProgress } from "@/lib/progress";
import { embedUrl, folderId } from "@/lib/embed";
import { shortDate } from "@/lib/format";
import { TYPE_LABELS } from "@/components/TypeIcon";

const today = () => new Date().toISOString().slice(0, 10);
const rid = () => Math.random().toString(36).slice(2, 10);

function guessType(url: string): DeliverableType | null {
  const u = url.toLowerCase();
  if (u.includes("drive.google.com/drive/folders")) return "folder";
  if (u.includes("docs.google.com/presentation") || u.includes("canva.com")) return "presentation";
  if (u.includes("docs.google.com") || u.endsWith(".pdf")) return "document";
  if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com") || u.includes("loom.com")) return "video";
  if (u.includes("figma.com")) return "design";
  return null;
}

function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

export default function WorkEditor({ c, update }: { c: Client; update: (fn: (d: Client) => void) => void }) {
  const [updateText, setUpdateText] = useState("");
  const progress = computeProgress(c);
  const groups = Array.from(new Set(c.deliverables.map((d) => d.group).filter(Boolean)));

  return (
    <>
      {/* PROGRESS & TIMELINE */}
      <section className="panel">
        <div className="row between">
          <h3>Progress & timeline</h3>
          {progress && <strong style={{ color: "var(--rust)" }}>{progress.percent}%</strong>}
        </div>
        {progress && (
          <div className="bar sm" aria-hidden="true"><span style={{ width: `${progress.percent}%` }} /></div>
        )}
        <p className="small muted">
          Add the milestones for this project with due dates. Check them off as you go and the client&rsquo;s progress bar fills in
          automatically.
        </p>
        {c.milestones.map((m, i) => (
          <div className="row" key={m.id} style={{ flexWrap: "nowrap", gap: 10 }}>
            <input type="checkbox" aria-label="Done" checked={m.done} onChange={() => update((d) => void (d.milestones[i].done = !d.milestones[i].done))} style={{ width: 20, height: 20, accentColor: "var(--rust)", flexShrink: 0 }} />
            <input type="text" placeholder="Milestone, e.g. Brand strategy approved" value={m.title} onChange={(e) => update((d) => void (d.milestones[i].title = e.target.value))} />
            <input type="date" aria-label="Due date" style={{ maxWidth: 170 }} value={m.due} onChange={(e) => update((d) => void (d.milestones[i].due = e.target.value))} />
            <button type="button" className="linkbtn small" aria-label="Move up" onClick={() => update((d) => move(d.milestones, i, -1))}>↑</button>
            <button type="button" className="linkbtn small" aria-label="Move down" onClick={() => update((d) => move(d.milestones, i, 1))}>↓</button>
            <button type="button" className="linkbtn danger small" onClick={() => update((d) => void d.milestones.splice(i, 1))}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.milestones.push({ id: rid(), title: "", due: "", done: false }))}>
          + Add milestone
        </button>
        <label style={{ maxWidth: 360 }}>
          Set progress by hand <span className="hint">Leave blank to calculate from milestones</span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Automatic"
            value={c.progressOverride ?? ""}
            onChange={(e) => update((d) => void (d.progressOverride = e.target.value === "" ? null : Math.min(100, Math.max(0, Number(e.target.value)))))}
          />
        </label>
      </section>

      {/* WORK & DELIVERABLES */}
      <section className="panel">
        <h3>Work & deliverables</h3>
        <p className="small muted">
          Everything you make for them: Google Docs, Sheets, Slides, websites, videos, content, recordings. Google files and videos can be
          previewed right inside their portal.
        </p>

        <label>
          Shared Google Drive folder <span className="hint">Optional. Whatever you put in this folder shows up in their portal live.</span>
          <input type="url" placeholder="https://drive.google.com/drive/folders/..." value={c.driveFolderUrl} onChange={(e) => update((d) => void (d.driveFolderUrl = e.target.value.trim()))} />
        </label>
        {c.driveFolderUrl && !folderId(c.driveFolderUrl) && (
          <p className="error-text small">That does not look like a Google Drive folder link. It should contain /folders/.</p>
        )}

        <datalist id="groups">
          {groups.map((g) => <option key={g} value={g} />)}
        </datalist>

        {c.deliverables.map((dv, i) => {
          const set = (fn: (x: Deliverable) => void) => update((d) => fn(d.deliverables[i]));
          const previewable = dv.url && embedUrl(dv.url);
          return (
            <div className="list-item" key={dv.id}>
              <div className="grid-2" style={{ gap: 10 }}>
                <label>Title<input type="text" placeholder="Brand strategy doc" value={dv.title} onChange={(e) => set((x) => void (x.title = e.target.value))} /></label>
                <label>
                  Link {previewable ? <span className="hint">✓ previews in portal</span> : null}
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={dv.url}
                    onChange={(e) => {
                      const url = e.target.value.trim();
                      set((x) => {
                        x.url = url;
                        const g = guessType(url);
                        if (g && x.type === "other") x.type = g;
                      });
                    }}
                  />
                </label>
                <label>
                  Type
                  <select value={dv.type} onChange={(e) => set((x) => void (x.type = e.target.value as DeliverableType))}>
                    {(Object.keys(TYPE_LABELS) as DeliverableType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </label>
                <label>
                  Status
                  <select value={dv.status} onChange={(e) => set((x) => void (x.status = e.target.value as Deliverable["status"]))}>
                    <option value="in-progress">In progress</option>
                    <option value="review">Ready for their review</option>
                    <option value="final">Final</option>
                  </select>
                </label>
                <label>Date added<input type="date" value={dv.date} onChange={(e) => set((x) => void (x.date = e.target.value))} /></label>
                <label>Due date <span className="hint">optional</span><input type="date" value={dv.dueDate} onChange={(e) => set((x) => void (x.dueDate = e.target.value))} /></label>
              </div>
              <label>
                Section <span className="hint">optional, e.g. Phase 1: Strategy or Brand Content</span>
                <input type="text" list="groups" value={dv.group} onChange={(e) => set((x) => void (x.group = e.target.value))} />
              </label>
              <label>Note to client<input type="text" placeholder="Leave comments right in the doc by Friday" value={dv.note} onChange={(e) => set((x) => void (x.note = e.target.value))} /></label>
              <div className="row">
                <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.deliverables, i, -1))}>Move up</button>
                <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.deliverables, i, 1))}>Move down</button>
                <button type="button" className="linkbtn danger small" onClick={() => confirm("Remove this item from their portal?") && update((d) => void d.deliverables.splice(i, 1))}>Remove</button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          style={{ alignSelf: "flex-start" }}
          onClick={() =>
            update((d) =>
              void d.deliverables.push({ id: rid(), title: "", type: "other", url: "", note: "", status: "in-progress", date: today(), dueDate: "", group: "" })
            )
          }
        >
          + Add deliverable
        </button>
        <p className="tiny muted">
          For previews to work, set each Google file or folder to <strong>Share &gt; General access &gt; Anyone with the link: Viewer</strong> (or
          Commenter if you want feedback in the doc).
        </p>
      </section>

      {/* UPDATES */}
      <section className="panel">
        <h3>Project updates</h3>
        <p className="small muted">Short notes your client sees under “Latest updates,” newest first.</p>
        <textarea placeholder="Finished the first draft of your SOPs. Take a look and leave comments by Friday." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
        <button
          type="button"
          className="btn btn-sm btn-dark"
          style={{ alignSelf: "flex-start" }}
          disabled={!updateText.trim()}
          onClick={() => {
            const text = updateText.trim();
            update((d) => void d.updates.unshift({ id: rid(), date: today(), text }));
            setUpdateText("");
          }}
        >
          Add update
        </button>
        {c.updates.map((u, i) => (
          <div key={u.id} className="stack" style={{ gap: 4, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <div className="row between">
              <span className="tiny muted">{shortDate(u.date)}</span>
              <button type="button" className="linkbtn danger tiny" onClick={() => update((d) => void d.updates.splice(i, 1))}>Delete</button>
            </div>
            <p className="small" style={{ whiteSpace: "pre-line" }}>{u.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
