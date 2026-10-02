"use client";

import { useState } from "react";

export default function CopyLink({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [t, setT] = useState(label);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="as-link">{url}</div>
      <button type="button" className="btn btn-sm btn-dark" style={{ alignSelf: "flex-start" }} onClick={async () => {
        try { await navigator.clipboard.writeText(url); setT("Copied"); } catch { setT("Select the link above to copy it"); }
        setTimeout(() => setT(label), 2000);
      }}>{t}</button>
    </div>
  );
}
