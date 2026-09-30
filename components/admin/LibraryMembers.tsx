"use client";

import { useState } from "react";
import { shortDate } from "@/lib/format";
import type { LibraryAccess } from "@/lib/wellness-types";

type Row = LibraryAccess & { name: string; email: string; slug: string; code: string };

export default function LibraryMembers({ members: initial, clients }: { members: Row[]; clients: { id: string; name: string; email: string }[] }) {
  const [rows, setRows] = useState(initial);
  const [f, setF] = useState({ clientId: "", name: "", email: "", plan: "individual", teamName: "", founding: true });
  const [msg, setMsg] = useState("");
  const [added, setAdded] = useState<{ name: string; code: string } | null>(null);

  async function patch(id: string, body: Partial<LibraryAccess>) {
    setRows((p) => p.map((r) => (r.clientId === id ? { ...r, ...body } : r)));
    await fetch(`/api/admin/wellness/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  async function remove(id: string) {
    if (!confirm("Remove their access to the library? Their client portal stays.")) return;
    setRows((p) => p.filter((r) => r.clientId !== id));
    await fetch(`/api/admin/wellness/members/${id}`, { method: "DELETE" });
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {added && (
        <div className="panel" role="status" style={{ borderTopColor: "var(--gold)" }}>
          <strong>{added.name} has access.</strong>
          <p className="small" style={{ margin: 0 }}>Send them their access code: <code>{added.code}</code>. They sign in at your site&rsquo;s /portal, and the library is linked from their portal.</p>
          <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => window.location.reload()}>Done</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Member</th><th>Plan</th><th>Since</th><th>Access code</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {!rows.length && <tr><td colSpan={6} className="muted">No members yet. Add your founding members below.</td></tr>}
            {rows.map((r) => (
              <tr key={r.clientId}>
                <td><strong>{r.name}</strong><div className="tiny muted">{r.email}</div></td>
                <td className="small">
                  {r.plan === "team" ? <span className="tag gold">Team</span> : <span className="tag">Individual</span>}
                  {r.founding && <span className="tag" style={{ marginLeft: 6 }}>Founding</span>}
                  {r.plan === "team" && r.teamName && <div className="tiny muted" style={{ marginTop: 4 }}>{r.teamName}</div>}
                </td>
                <td className="small muted">{shortDate(r.since)}</td>
                <td className="small"><code>{r.code}</code></td>
                <td>
                  <select aria-label={`Status for ${r.name}`} value={r.status} onChange={(e) => patch(r.clientId, { status: e.target.value as LibraryAccess["status"] })} style={{ minHeight: 38, padding: "6px 10px", fontSize: "0.95rem", width: "auto", minWidth: 110 }}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </select>
                </td>
                <td><button type="button" className="linkbtn danger small" onClick={() => remove(r.clientId)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="panel" style={{ maxWidth: 860 }} onSubmit={async (e) => {
        e.preventDefault();
        setMsg("");
        const res = await fetch("/api/admin/wellness/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) return setMsg(d.error || "Could not add them.");
        const name = f.clientId ? clients.find((c) => c.id === f.clientId)?.name ?? "" : f.name;
        setAdded({ name, code: d.code });
        setF({ clientId: "", name: "", email: "", plan: f.plan, teamName: f.teamName, founding: f.founding });
      }}>
        <h3>Give someone access</h3>
        <p className="small muted" style={{ margin: 0 }}>Add founding members from your waitlist, or give an existing client access. New people get a client portal and an access code.</p>
        <label>
          Existing client <span className="hint">or leave blank to add a new person</span>
          <select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">New person</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>)}
          </select>
        </label>
        {!f.clientId && (
          <div className="grid-2" style={{ gap: 12 }}>
            <label>Name<input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          </div>
        )}
        <div className="grid-3" style={{ gap: 12 }}>
          <label>Plan<select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}><option value="individual">Individual</option><option value="team">Team</option></select></label>
          {f.plan === "team" && <label>Team or organization<input type="text" value={f.teamName} onChange={(e) => setF({ ...f, teamName: e.target.value })} /></label>}
          <label className="checks" style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400, paddingTop: 28 }}>
            <input type="checkbox" checked={f.founding} onChange={() => setF({ ...f, founding: !f.founding })} /> Founding member
          </label>
        </div>
        {msg && <p className="error-text">{msg}</p>}
        <button className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }}>Give access</button>
      </form>
    </div>
  );
}
