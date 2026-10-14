"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolDef } from "@/lib/tools-def";
import { TOOL_VIEWS } from "./registry";

/** Loads, autosaves, and frames one tool. mode "public" keeps everything in the browser. */
export default function ToolShell({ tool, mode, initial, today, clientId }: { tool: ToolDef; mode: "client" | "admin" | "public"; initial?: { data: unknown; private: boolean; updatedAt?: string }; today: string; clientId?: string }) {
  const View = TOOL_VIEWS[tool.id];
  const [data, setData] = useState<unknown>(initial?.data ?? null);
  const [priv, setPriv] = useState(initial?.private ?? !!tool.privateByDefault);
  const [state, setState] = useState<"" | "saving" | "saved" | "error">(initial?.updatedAt ? "saved" : "");
  const [err, setErr] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Record<string, unknown> | null>(null);
  const ro = mode === "admin";

  async function flush() {
    if (!pending.current) return;
    const body = { tool: tool.id, ...pending.current };
    pending.current = null;
    setState("saving");
    const r = await fetch("/api/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (!r || !r.ok) { const d = await r?.json().catch(() => ({})); setErr(d?.error || "Couldn't save. Check your connection; your changes are still on this page."); setState("error"); return; }
    setErr(""); setState("saved");
  }
  function queue(p: Record<string, unknown>, now = false) {
    if (mode !== "client") return;
    pending.current = { ...(pending.current ?? {}), ...p };
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, now ? 0 : 800);
  }
  useEffect(() => {
    const leave = () => { if (pending.current) navigator.sendBeacon?.("/api/tools", new Blob([JSON.stringify({ tool: tool.id, ...pending.current })], { type: "application/json" })); };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [tool.id]);

  const set = (d: unknown) => { setData(d); queue({ data: d }); };
  if (!View) return <p>This tool isn&rsquo;t available.</p>;
  return (
    <div className="stack tl" style={{ gap: 16 }}>
      {mode !== "public" && (
        <div className="row between tl-bar no-print" style={{ gap: 10, flexWrap: "wrap" }}>
          {mode === "client" ? (
            <label className="row small" style={{ gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={priv} onChange={(e) => { setPriv(e.target.checked); queue({ private: e.target.checked }, true); }} />
              {priv ? "Private: only you can see this" : "Build & Bloom can see this (to help in sessions)"}
            </label>
          ) : <span className="small muted">View only. {clientId ? "The client makes all changes." : ""}</span>}
          <span className="row small" style={{ gap: 12 }}>
            <span className="muted" role="status">{state === "saving" ? "Saving..." : state === "saved" ? "Saved" : state === "error" ? "Not saved" : mode === "client" ? "Saves as you type" : ""}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => window.print()}>Print</button>
          </span>
        </div>
      )}
      {err && <p className="error-text" role="alert">{err}</p>}
      <View data={data} set={set} ro={ro} today={today} />
    </div>
  );
}
