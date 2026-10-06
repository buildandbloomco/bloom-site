"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { CLIENT_MAX, FILE_ACCEPT, fileSize, type SharedFile } from "@/lib/files-def";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Files you and a client pass back and forth. Used in the portal (as the client) and in admin (as you). */
export default function SharedFiles({ initial, as, clientId }: { initial: SharedFile[]; as: "client" | "us"; clientId: string }) {
  const [files, setFiles] = useState(initial);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const uploadUrl = as === "client" ? "/api/portal/upload" : "/api/admin/upload";
  const api = as === "client" ? "/api/portal/files" : `/api/admin/clients/${clientId}/files`;

  async function go(file: File) {
    setMsg("");
    try {
      if (as === "client" && file.size > CLIENT_MAX) throw new Error("That file is over 50 MB. Please send a smaller one, or email us a link.");
      const check = await fetch(uploadUrl).then((r) => r.json()).catch(() => ({ ready: false }));
      if (!check.ready) throw new Error(check.error || (as === "client" ? "File sharing is not turned on yet. Please email your file instead." : "Uploads aren't set up yet. In Vercel, open Storage, create a Blob store, and connect it to this project (see the README)."));
      setPct(0);
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").slice(-80);
      const blob = await upload(`clients/${clientId}/${safe}`, file, { access: "public", handleUploadUrl: uploadUrl, multipart: file.size > 20 * 1024 * 1024, onUploadProgress: (e) => setPct(Math.round(e.percentage)) });
      const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, url: blob.url, size: file.size, note }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "The file uploaded but could not be listed. Try again.");
      setFiles(j.files); setNote(""); setMsg("Uploaded.");
    } catch (e) {
      setMsg((e as Error).message || "Upload failed.");
    } finally {
      setPct(null);
      if (ref.current) ref.current.value = "";
    }
  }
  async function remove(f: SharedFile) {
    if (!confirm(`Remove "${f.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${api}?id=${f.id}`, { method: "DELETE" });
    const j = await res.json();
    if (res.ok) setFiles(j.files); else setMsg(j.error || "Could not remove it.");
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {files.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Nothing shared yet.</p> : (
        <div>
          {files.map((f) => {
            const mine = f.by === as;
            return (
              <div className="file-row" key={f.id}>
                <div className="stack" style={{ gap: 2, minWidth: 0, flex: "1 1 220px" }}>
                  <a className="name" href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a>
                  <span className="tiny muted">{mine ? "From you" : as === "client" ? "From Build & Bloom" : "From the client"} · {day(f.at)}{f.size ? ` · ${fileSize(f.size)}` : ""}</span>
                  {f.note && <span className="small">{f.note}</span>}
                </div>
                {(as === "us" || mine) && <button type="button" className="linkbtn small" onClick={() => remove(f)}>Remove</button>}
              </div>
            );
          })}
        </div>
      )}
      <div className="stack" style={{ gap: 8 }}>
        <label className="small">A note about the file <span className="hint">optional</span><input type="text" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What it is, or what you need from it" /></label>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn-sm btn-dark" disabled={pct !== null} onClick={() => ref.current?.click()}>{pct !== null ? `Uploading ${pct}%` : "Upload a file"}</button>
          <input ref={ref} type="file" accept={FILE_ACCEPT} className="sr-only" aria-label="Choose a file to upload" onChange={(e) => e.target.files?.[0] && go(e.target.files[0])} />
          <span className="tiny muted">PDF, Word, Excel, PowerPoint, images, or text{as === "client" ? ", up to 50 MB" : ""}.</span>
        </div>
        {msg && <span className={`small ${msg === "Uploaded." ? "ok-text" : "error-text"}`} role="status">{msg}</span>}
      </div>
    </div>
  );
}
