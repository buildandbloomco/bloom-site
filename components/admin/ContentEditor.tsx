"use client";

import "./content.css";
import { useState } from "react";
import { CONTENT_STATUSES, CONTENT_TYPES, contentTypeLabel, posterFor, type ContentMedia, type ContentPost } from "@/lib/content-types";
import Uploader from "./Uploader";

const niceDate = (s: string) => {
  if (!s) return "No date yet";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};
const fileName = (url: string) => decodeURIComponent(url.split("?")[0].split("/").pop() || "file");
const downloadHref = (url: string) => (/blob\.vercel-storage\.com/.test(url) ? `${url}${url.includes("?") ? "&" : "?"}download=1` : url);

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState(label);
  return (
    <button type="button" className="btn btn-sm btn-dark" disabled={!text} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setState("Copied"); }
      catch { setState("Couldn't copy. Select the text instead."); }
      setTimeout(() => setState(label), 1800);
    }}>{state}</button>
  );
}

export default function ContentEditor({ initial, campaigns }: { initial: ContentPost; campaigns: string[] }) {
  const [p, setP] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState("");
  const up = (fn: (d: ContentPost) => void) => { setP((prev) => { const d = structuredClone(prev); fn(d); return d; }); setDirty(true); setMsg(""); };
  const upM = (i: number, fn: (m: ContentMedia) => void) => up((d) => fn(d.media[i]));

  async function save(extra?: Partial<ContentPost>) {
    setSaving(true);
    const res = await fetch(`/api/admin/content/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, ...extra }) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(d.error || "Could not save.");
    setP(d);
    setDirty(false);
    setMsg("Saved");
  }

  const fullCaption = [p.caption.trim(), p.hashtags.trim()].filter(Boolean).join("\n\n");
  const isYT = p.type === "youtube";
  const addMedia = (url: string) => up((d) => void d.media.push({ url, kind: /\.(mp4|mov|webm)(\?|$)/i.test(url) ? "video" : "image", label: "" }));

  return (
    <div className={`ct stack ct-type-${p.type}`} style={{ gap: 20, maxWidth: 1180 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow" style={{ color: "var(--c)" }}>{p.launch ? "★ Launch · " : ""}{contentTypeLabel(p.type)}{p.campaign ? ` · ${p.campaign}` : ""}</p>
          <h2 style={{ textTransform: "none", letterSpacing: 0 }}>{p.title}</h2>
          <p className="small muted" style={{ margin: 0 }}>{niceDate(p.date)}</p>
        </div>
        <div className="ct-status" role="group" aria-label="Status">
          {CONTENT_STATUSES.map((s) => (
            <button key={s.id} type="button" aria-pressed={p.status === s.id} disabled={saving} onClick={() => save({ status: s.id })}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="ct-post">
        {/* What to post */}
        <div className="stack" style={{ gap: 20 }}>
          {p.type === "face" && (
            <div className="ct-face">
              <strong>Saved for you on camera.</strong>
              <p className="small" style={{ margin: "6px 0 0", whiteSpace: "pre-line" }}>{p.notes || "Add your idea in the notes."}</p>
              <p className="small muted" style={{ margin: "8px 0 0" }}>Once you record it, upload the video below and add a caption.</p>
            </div>
          )}

          <section className="panel">
            <h3>{p.media.length > 1 ? `Files (${p.media.length})` : "File"}</h3>
            {p.media.length === 0 && <p className="small muted" style={{ margin: 0 }}>No file yet. Upload one below.</p>}
            {p.media.length > 0 && (
              <div className="ct-media">
                {p.media.map((m, i) => (
                  <figure key={`${m.url}-${i}`}>
                    {m.kind === "video"
                      ? <video className="tall" src={m.url} poster={posterFor(m.url)} controls playsInline preload="metadata" />
                      : <img className={/thumb|youtube/i.test(m.label + m.url) ? "wide" : /stor/i.test(m.label + m.url) ? "tall" : ""} src={m.url} alt={m.label || `${p.title} image ${i + 1}`} loading="lazy" />}
                    <figcaption>
                      <span>{m.label || (p.media.length > 1 ? `File ${i + 1}` : contentTypeLabel(p.type))}</span>
                      <a href={downloadHref(m.url)} download={fileName(m.url)}>Save</a>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {p.media.length > 0 && <p className="tiny muted" style={{ margin: 0 }}>On a phone: tap <strong>Save</strong>, or open the file and press and hold it to save it to Photos.{p.type === "carousel" ? " Save the slides in order, then pick them in that order in Instagram." : ""}</p>}
          </section>

          {p.notes && p.type !== "face" && <p className="ct-note small" style={{ margin: 0, whiteSpace: "pre-line" }}><strong>Note:</strong> {p.notes}</p>}
        </div>

        {/* Words */}
        <div className="stack" style={{ gap: 20 }}>
          <section className="panel">
            {isYT && (
              <>
                <div className="row between"><h3>YouTube title</h3><CopyButton text={p.ytTitle} label="Copy title" /></div>
                <p className="ct-caption" style={{ margin: 0 }}>{p.ytTitle || <span className="muted">No title yet</span>}</p>
              </>
            )}
            <div className="row between">
              <h3>{isYT ? "Description" : "Caption"}</h3>
              <div className="ct-copyrow">
                <CopyButton text={fullCaption} label={p.hashtags ? "Copy with hashtags" : "Copy"} />
              </div>
            </div>
            <p className="ct-caption" style={{ margin: 0 }}>{p.caption || <span className="muted">No caption yet</span>}</p>
            {p.hashtags && <p className="small muted" style={{ margin: 0 }}>{p.hashtags}</p>}
            {p.keywords.length > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                <div className="row between">
                  <strong className="small">{isYT ? "Tags" : "Keywords"}</strong>
                  {isYT && <CopyButton text={p.keywords.join(", ")} label="Copy tags" />}
                </div>
                <div className="ct-kw">{p.keywords.map((k) => <span key={k}>{k}</span>)}</div>
                {!isYT && <p className="tiny muted" style={{ margin: 0 }}>Work one or two of these into the caption and the alt text (Advanced settings in Instagram) so the post shows up in search.</p>}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Editing */}
      <section className="panel">
        <h3>Edit details</h3>
        <div className="grid-3" style={{ gap: 12 }}>
          <label>Title<input type="text" value={p.title} onChange={(e) => up((d) => void (d.title = e.target.value))} /></label>
          <label>Date <span className="hint">empty = idea</span><input type="date" value={p.date} onChange={(e) => up((d) => void (d.date = e.target.value))} /></label>
          <label>Type<select value={p.type} onChange={(e) => up((d) => void (d.type = e.target.value as ContentPost["type"]))}>{CONTENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <label>Campaign <span className="hint">groups related posts</span><input type="text" list="ct-campaigns" value={p.campaign} onChange={(e) => up((d) => void (d.campaign = e.target.value))} /></label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "end" }}><input type="checkbox" checked={p.launch} onChange={() => up((d) => void (d.launch = !d.launch))} /> Mark as a launch post (★)</label>
        </div>
        <datalist id="ct-campaigns">{campaigns.map((c) => <option key={c} value={c} />)}</datalist>
        {isYT && <label>YouTube title<input type="text" value={p.ytTitle} onChange={(e) => up((d) => void (d.ytTitle = e.target.value))} /></label>}
        <label>{isYT ? "Description" : "Caption"}<textarea style={{ minHeight: 220, lineHeight: 1.5 }} value={p.caption} onChange={(e) => up((d) => void (d.caption = e.target.value))} /></label>
        {!isYT && <label>Hashtags<input type="text" value={p.hashtags} onChange={(e) => up((d) => void (d.hashtags = e.target.value))} placeholder="#BuildAndBloom #TheRightYes" /></label>}
        <label>{isYT ? "Tags" : "Keywords"} <span className="hint">separate with commas</span><input type="text" value={p.keywords.join(", ")} onChange={(e) => up((d) => void (d.keywords = e.target.value.split(",").map((k) => k.trim())))} onBlur={() => up((d) => void (d.keywords = d.keywords.filter(Boolean)))} /></label>
        <label>Notes to yourself<textarea style={{ minHeight: 80 }} value={p.notes} onChange={(e) => up((d) => void (d.notes = e.target.value))} /></label>
      </section>

      <section className="panel">
        <h3>Files</h3>
        {p.media.map((m, i) => (
          <div key={`${m.url}-e${i}`} className="row" style={{ gap: 10, borderTop: i ? "1px solid var(--line)" : 0, paddingTop: i ? 10 : 0 }}>
            {m.kind === "video" ? (posterFor(m.url) ? <img src={posterFor(m.url)} alt="" className="ct-thumb" /> : <video src={`${m.url}#t=1`} muted preload="metadata" className="ct-thumb" />) : <img src={m.url} alt="" className="ct-thumb" />}
            <label style={{ flex: "1 1 180px" }}>Label <span className="hint">optional, like Slide 2 or Story</span><input type="text" value={m.label} onChange={(e) => upM(i, (x) => void (x.label = e.target.value))} /></label>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="linkbtn tiny" disabled={i === 0} onClick={() => up((d) => { const [x] = d.media.splice(i, 1); d.media.splice(i - 1, 0, x); })}>Move up</button>
              <button type="button" className="linkbtn tiny" disabled={i === p.media.length - 1} onClick={() => up((d) => { const [x] = d.media.splice(i, 1); d.media.splice(i + 1, 0, x); })}>Move down</button>
              <button type="button" className="linkbtn danger tiny" onClick={() => up((d) => void d.media.splice(i, 1))}>Remove</button>
            </div>
          </div>
        ))}
        <Uploader accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" folder="content" label="Upload an image or video" onDone={addMedia} />
        <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
          <label style={{ flex: "1 1 260px" }}>Or paste a link to an image or MP4<input type="url" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} /></label>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!/^https:\/\//.test(link)} onClick={() => { addMedia(link.trim()); setLink(""); }}>Add</button>
        </div>
        <button type="button" className="linkbtn danger small" style={{ alignSelf: "flex-start" }} onClick={async () => {
          if (!confirm("Delete this post from your content calendar?")) return;
          await fetch(`/api/admin/content/${p.id}`, { method: "DELETE" });
          window.location.href = "/admin/content";
        }}>Delete post</button>
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
