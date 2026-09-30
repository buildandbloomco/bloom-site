"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

/** Upload a file from your computer and get back its link */
export default function Uploader({ accept, label = "Upload a file", folder = "library", onDone }: { accept: string; label?: string; folder?: string; onDone: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  async function go(file: File) {
    setMsg("");
    const check = await fetch("/api/admin/upload").then((r) => r.json()).catch(() => ({ ready: false }));
    if (!check.ready) {
      setMsg(check.error || "Uploads aren't set up yet. In Vercel, open Storage, create a Blob store, and connect it to this project (see the README). You can paste a link below in the meantime.");
      if (ref.current) ref.current.value = "";
      return;
    }
    setPct(0);
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
      const blob = await upload(`${folder}/${safe}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        multipart: file.size > 50 * 1024 * 1024,
        onUploadProgress: (e) => setPct(Math.round(e.percentage)),
      });
      setPct(null);
      setMsg("Uploaded. Remember to save.");
      onDone(blob.url);
    } catch (e) {
      setPct(null);
      setMsg((e as Error).message || "Upload failed.");
    } finally {
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row" style={{ gap: 10 }}>
        <button type="button" className="btn btn-sm btn-dark" disabled={pct !== null} onClick={() => ref.current?.click()}>
          {pct !== null ? `Uploading ${pct}%` : label}
        </button>
        <input ref={ref} type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && go(e.target.files[0])} />
        {pct !== null && <div className="bar sm" style={{ width: 180 }} aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>}
      </div>
      {msg && <span className={`small ${/Uploaded/.test(msg) ? "ok-text" : "error-text"}`} role="status">{msg}</span>}
    </div>
  );
}
