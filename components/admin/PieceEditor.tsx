"use client";

import { useState } from "react";
import { PIECE_TYPES, type LibraryPiece } from "@/lib/wellness-types";
import type { Prompt } from "@/lib/course-types";
import Uploader from "./Uploader";

const rid = () => Math.random().toString(36).slice(2, 10);

export default function PieceEditor({ initial, collections }: { initial: LibraryPiece; collections: string[] }) {
  const [p, setP] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const up = (fn: (d: LibraryPiece) => void) => { setP((prev) => { const d = structuredClone(prev); fn(d); return d; }); setDirty(true); setMsg(""); };
  const upQ = (i: number, fn: (q: Prompt) => void) => up((d) => fn(d.prompts[i]));

  async function save(extra?: Partial<LibraryPiece>) {
    setSaving(true);
    const body = { ...p, ...extra };
    const res = await fetch(`/api/admin/wellness/pieces/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(d.error || "Could not save.");
    setP(d);
    setDirty(false);
    setMsg("Saved");
  }

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 900 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Wellness Library · {PIECE_TYPES.find((t) => t.id === p.type)?.label}</p>
          <h2 style={{ textTransform: "none", letterSpacing: 0 }}>{p.title || "Untitled"}</h2>
        </div>
        <div className="row">
          <span className={`tag ${p.status === "published" ? "green" : ""}`}>{p.status === "published" ? "Published" : "Draft"}</span>
          <a className="btn btn-sm btn-ghost" href={`/library/${p.slug}`} target="_blank" rel="noopener noreferrer">Preview ↗</a>
          {p.status === "draft"
            ? <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={() => save({ status: "published" })}>Save &amp; publish</button>
            : <button type="button" className="btn btn-sm btn-ghost" disabled={saving} onClick={() => save({ status: "draft" })}>Unpublish</button>}
        </div>
      </div>

      {p.adminNote && <p className="lib-note" style={{ margin: 0 }}><strong>To do:</strong> {p.adminNote}</p>}

      <section className="panel">
        <h3>Basics</h3>
        <div className="grid-2" style={{ gap: 12 }}>
          <label>Title<input type="text" value={p.title} onChange={(e) => up((d) => void (d.title = e.target.value))} /></label>
          <label>Page address <span className="hint">/library/{p.slug}</span><input type="text" value={p.slug} onChange={(e) => up((d) => void (d.slug = e.target.value))} /></label>
        </div>
        <div className="grid-3" style={{ gap: 12 }}>
          <label>Type<select value={p.type} onChange={(e) => up((d) => void (d.type = e.target.value as LibraryPiece["type"]))}>{PIECE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          <label>Minutes<input type="number" min={0} value={p.minutes} onChange={(e) => up((d) => void (d.minutes = Number(e.target.value)))} /></label>
          <label>Order <span className="hint">lower shows first</span><input type="number" min={0} value={p.order} onChange={(e) => up((d) => void (d.order = Number(e.target.value)))} /></label>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <label>Collection <span className="hint">groups pieces on the library page</span><input type="text" list="piece-collections" value={p.collection} onChange={(e) => up((d) => void (d.collection = e.target.value))} /></label>
          <label>When to use it<input type="text" placeholder="For the start of the day" value={p.when} onChange={(e) => up((d) => void (d.when = e.target.value))} /></label>
        </div>
        <datalist id="piece-collections">{collections.map((c) => <option key={c} value={c} />)}</datalist>
        <label>Short description <span className="hint">shown on the library card</span><textarea style={{ minHeight: 70 }} value={p.summary} onChange={(e) => up((d) => void (d.summary = e.target.value))} /></label>
        <div className="checks">
          <label><input type="checkbox" checked={p.teamOnly} onChange={() => up((d) => void (d.teamOnly = !d.teamOnly))} /> Teams only</label>
        </div>
      </section>

      {(p.type === "audio" || p.audioUrl) && (
        <section className="panel">
          <h3>Recording</h3>
          <Uploader accept="audio/*" label="Upload audio (MP3 or M4A)" onDone={(url) => up((d) => { d.audioUrl = url; if (/audio/i.test(d.adminNote)) d.adminNote = ""; })} />
          <label>
            Or paste a link <span className="hint">MP3 link, or a Google Drive or Dropbox share link set to &ldquo;Anyone with the link&rdquo;</span>
            <input type="url" placeholder="https://..." value={p.audioUrl} onChange={(e) => up((d) => void (d.audioUrl = e.target.value))} />
          </label>
          {p.audioUrl && <audio controls preload="none" src={p.audioUrl} style={{ width: "100%" }} />}
          <p className="small muted" style={{ margin: 0 }}>Until there is a recording, members can read along with the script below. Pauses in [brackets] are hidden from members and are cues for your narrator.</p>
        </section>
      )}

      <section className="panel">
        <h3>Video</h3>
        <p className="small muted" style={{ margin: 0 }}>{p.type === "soundscape" ? "Upload the soundscape video. It loops for members until they stop it." : "Optional. Add a video to any piece, like a welcome message or a guided practice."}</p>
        <Uploader accept="video/mp4,video/quicktime,video/webm" label={p.videoUrl ? "Replace video" : "Upload video (MP4)"} onDone={(url) => up((d) => { d.videoUrl = url; if (/^Upload .*Video section/.test(d.adminNote)) d.adminNote = ""; })} />
        <label>Or paste a link <span className="hint">a direct MP4 link</span><input type="url" placeholder="https://..." value={p.videoUrl ?? ""} onChange={(e) => up((d) => void (d.videoUrl = e.target.value))} /></label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={p.videoLoop ?? p.type === "soundscape"} onChange={(e) => up((d) => void (d.videoLoop = e.target.checked))} />
          Play on a loop <span className="hint">the video repeats until the member stops it</span>
        </label>
        {p.videoUrl && (
          <>
            <video controls preload="metadata" loop={p.videoLoop ?? p.type === "soundscape"} src={p.videoUrl} style={{ width: "100%", maxHeight: 360, borderRadius: 12, background: "#000" }} />
            <button type="button" className="linkbtn danger small" style={{ alignSelf: "flex-start" }} onClick={() => up((d) => void (d.videoUrl = ""))}>Remove video</button>
          </>
        )}
      </section>

      <section className="panel">
        <h3>{p.type === "audio" ? "Script" : "The piece"}</h3>
        <p className="small muted" style={{ margin: 0 }}>Formatting: a blank line starts a new paragraph · <code>## Heading</code> · <code>- bullet</code> · <code>1. step</code> · <code>**bold**</code> · <code>*italic*</code> · <code>&gt; quote</code></p>
        <textarea style={{ minHeight: 420, fontSize: "1rem", lineHeight: 1.55 }} value={p.body} onChange={(e) => up((d) => void (d.body = e.target.value))} aria-label="Piece text" />
      </section>

      <section className="panel">
        <h3>Private reflections</h3>
        <p className="small muted" style={{ margin: 0 }}>Fill-in fields shown under the piece. Each member&rsquo;s answers are private to them. To start a new section, begin the note with &ldquo;Journal &middot;&rdquo;, for example &ldquo;Journal &middot; Looking ahead&rdquo;.</p>
        {p.prompts.map((q, i) => (
          <div key={q.id} className="stack" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="grid-2" style={{ gap: 10, gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1fr)" }}>
              <label>Question<input type="text" value={q.label} onChange={(e) => upQ(i, (x) => void (x.label = e.target.value))} /></label>
              <label>Answer type<select value={q.type} onChange={(e) => upQ(i, (x) => void (x.type = e.target.value as Prompt["type"]))}><option value="long">Paragraph</option><option value="short">One line</option><option value="checklist">Checklist</option><option value="scale">1 to 10 scale</option></select></label>
            </div>
            <label>Note or section title <span className="hint">optional</span><input type="text" value={q.help} onChange={(e) => upQ(i, (x) => void (x.help = e.target.value))} /></label>
            {q.type === "checklist" && <label>Checklist items <span className="hint">one per line</span><textarea value={q.options.join("\n")} onChange={(e) => upQ(i, (x) => void (x.options = e.target.value.split("\n")))} /></label>}
            <div className="row" style={{ gap: 12 }}>
              <button type="button" className="linkbtn tiny" disabled={i === 0} onClick={() => up((d) => { const [x] = d.prompts.splice(i, 1); d.prompts.splice(i - 1, 0, x); })}>Move up</button>
              <button type="button" className="linkbtn tiny" disabled={i === p.prompts.length - 1} onClick={() => up((d) => { const [x] = d.prompts.splice(i, 1); d.prompts.splice(i + 1, 0, x); })}>Move down</button>
              <button type="button" className="linkbtn danger tiny" onClick={() => up((d) => void d.prompts.splice(i, 1))}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => up((d) => void d.prompts.push({ id: rid(), type: "long", label: "", help: "", columns: [], rows: [], blankRows: 0, options: [] }))}>+ Add a question</button>
      </section>

      <section className="panel">
        <h3>Note to yourself</h3>
        <label>Only you see this <input type="text" value={p.adminNote} onChange={(e) => up((d) => void (d.adminNote = e.target.value))} placeholder="Waiting on narrator" /></label>
        <button type="button" className="linkbtn danger small" style={{ alignSelf: "flex-start" }} onClick={async () => {
          if (!confirm("Delete this piece? Members' saved reflections for it will no longer show.")) return;
          await fetch(`/api/admin/wellness/pieces/${p.id}`, { method: "DELETE" });
          window.location.href = "/admin/wellness";
        }}>Delete piece</button>
      </section>

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={() => save()} disabled={saving}>Save</button>}
        </div>
      )}
    </div>
  );
}
