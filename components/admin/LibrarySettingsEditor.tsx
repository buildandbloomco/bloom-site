"use client";

import { useState } from "react";
import type { LibrarySettings } from "@/lib/wellness-types";

export default function LibrarySettingsEditor({ initial }: { initial: LibrarySettings }) {
  const [intro, setIntro] = useState(initial.intro);
  const [aff, setAff] = useState(initial.affirmations.join("\n"));
  const [msg, setMsg] = useState("");
  return (
    <form className="panel" style={{ maxWidth: 820 }} onSubmit={async (e) => {
      e.preventDefault();
      setMsg("Saving...");
      const res = await fetch("/api/admin/wellness/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro, affirmations: aff.split("\n") }) });
      setMsg(res.ok ? "Saved" : "Could not save.");
    }}>
      <label>Welcome line <span className="hint">Shown at the top of the library home page</span><textarea value={intro} onChange={(e) => setIntro(e.target.value)} /></label>
      <label>Affirmations <span className="hint">One per line. A different one shows each day.</span><textarea style={{ minHeight: 320 }} value={aff} onChange={(e) => setAff(e.target.value)} /></label>
      <div className="row"><button className="btn btn-sm btn-primary">Save</button>{msg && <span className="small" role="status">{msg}</span>}</div>
    </form>
  );
}
