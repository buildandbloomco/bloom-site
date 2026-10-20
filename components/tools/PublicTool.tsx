"use client";

import { useState } from "react";
import type { ToolDef } from "@/lib/tools-def";
import { TOOL_VIEWS } from "./registry";

/** A free tool on the public website. Nothing is saved unless they ask for their results. */
export default function PublicTool({ tool, today, bookHref, debriefHref }: { tool: ToolDef; today: string; bookHref: string; debriefHref?: string }) {
  const View = TOOL_VIEWS[tool.id];
  const [data, setData] = useState<unknown>(null);
  const [f, setF] = useState({ name: "", email: "", business: "", company_url: "" });
  const [state, setState] = useState<"" | "busy" | "done">("");
  const [err, setErr] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy"); setErr("");
    const r = await fetch("/api/tools/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: tool.id, data, ...f }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Something went wrong. Please try again."); setState(""); return; }
    setState("done");
  }
  if (!View) return null;
  return (
    <div className="stack" style={{ gap: 24 }}>
      <View data={data} set={setData} today={today} />
      <section className="card stack" style={{ gap: 12, borderTopColor: "var(--gold)" }}>
        {state === "done" ? (
          <div className="stack" style={{ gap: 8 }} role="status">
            <h3 style={{ margin: 0 }}>Saved. Thank you, {f.name.split(" ")[0]}.</h3>
            <p style={{ margin: 0 }}>We have your results, and we&rsquo;ll follow up by email. Want to talk through them? {tool.id === "bloom-check" ? "Book a free 20-minute debrief." : "A free consult is the easiest next step."}</p>
            <div><a className="btn btn-primary btn-sm" href={tool.id === "bloom-check" && debriefHref ? debriefHref : bookHref}>{tool.id === "bloom-check" ? "Book my free debrief" : "Book a free consult"}</a></div>
          </div>
        ) : (
          <form className="stack" style={{ gap: 12 }} onSubmit={send}>
            <div className="stack" style={{ gap: 2 }}>
              <h3 style={{ margin: 0 }}>Save my results</h3>
              <span className="small muted">Get your results to Build &amp; Bloom, plus a free starter guide. Clients get this tool, and 11 more, saved in their own portal.</span>
            </div>
            <div className="ev-fields">
              <label>Your name<input type="text" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label>Business or organization <span className="hint">Optional</span><input type="text" value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} /></label>
            </div>
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999 }} value={f.company_url} onChange={(e) => setF({ ...f, company_url: e.target.value })} />
            {err && <p className="error-text" role="alert">{err}</p>}
            <div><button className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? "Saving..." : "Save my results"}</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
