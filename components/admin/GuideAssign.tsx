"use client";

import { useState } from "react";

/** Choose which guidebooks show in this client's portal */
export default function GuideAssign({ clientId, guides, initial }: { clientId: string; guides: { slug: string; title: string }[]; initial: string[] }) {
  const [on, setOn] = useState(initial);
  const [msg, setMsg] = useState("");
  async function toggle(slug: string) {
    const next = on.includes(slug) ? on.filter((s) => s !== slug) : [...on, slug];
    setOn(next); setMsg("Saving...");
    const res = await fetch(`/api/admin/clients/${clientId}/guides`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slugs: next }) });
    setMsg(res.ok ? "Saved" : "Not saved");
  }
  return (
    <div className="stack" style={{ gap: 6 }}>
      {guides.map((g) => (
        <label key={g.slug} className="row small" style={{ gap: 8, flexWrap: "nowrap", alignItems: "flex-start" }}>
          <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={on.includes(g.slug)} onChange={() => toggle(g.slug)} />
          <span>{g.title}</span>
        </label>
      ))}
      <span className="tiny muted" role="status">{msg}</span>
    </div>
  );
}
