"use client";

import { Fragment, useState } from "react";
import { interestLabel } from "@/lib/wellness";
import { shortDate } from "@/lib/format";
import type { WaitlistEntry } from "@/lib/types";

export default function WaitlistTable({ rows: initial }: { rows: WaitlistEntry[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<"all" | "individual" | "team">("all");
  const [open, setOpen] = useState("");
  const shown = rows.filter((r) => filter === "all" || r.plan === filter);

  async function setStatus(id: string, status: WaitlistEntry["status"]) {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/admin/waitlist/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }
  async function remove(id: string) {
    if (!confirm("Remove this person from the waitlist?")) return;
    setRows((p) => p.filter((r) => r.id !== id));
    await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" role="tablist" aria-label="Filter">
        {(["all", "individual", "team"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} className={`btn btn-sm ${filter === k ? "btn-dark" : "btn-ghost"}`} onClick={() => setFilter(k)}>
            {k === "all" ? "Everyone" : k === "team" ? "Teams" : "Individuals"}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Plan</th><th>Interested in</th><th>Joined</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {!shown.length && <tr><td colSpan={6} className="muted">No one yet. Share your Wellness Library page on Instagram to start the list.</td></tr>}
            {shown.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    <strong>{r.name}</strong>
                    <div className="tiny muted">{r.email}</div>
                  </td>
                  <td className="small">
                    {r.plan === "team" ? <span className="tag gold">Team</span> : <span className="tag">Individual</span>}
                    {r.plan === "team" && <div className="tiny muted" style={{ marginTop: 4 }}>{[r.organization, r.teamSize && `${r.teamSize} people`].filter(Boolean).join(" · ")}</div>}
                  </td>
                  <td className="small">{r.interests.length ? r.interests.map(interestLabel).join(", ") : <span className="muted">Not specified</span>}</td>
                  <td className="small muted">{shortDate(r.createdAt)}</td>
                  <td>
                    <select aria-label={`Status for ${r.name}`} value={r.status} onChange={(e) => setStatus(r.id, e.target.value as WaitlistEntry["status"])} style={{ minHeight: 38, padding: "6px 10px", fontSize: "0.95rem", width: "auto", minWidth: 120 }}>
                      <option value="waiting">Waiting</option>
                      <option value="invited">Invited</option>
                      <option value="joined">Joined</option>
                    </select>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                      {(r.note || r.role || r.heardFrom) && <button type="button" className="linkbtn small" onClick={() => setOpen(open === r.id ? "" : r.id)}>{open === r.id ? "Hide" : "Details"}</button>}
                      <button type="button" className="linkbtn danger small" onClick={() => remove(r.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td colSpan={6} className="small" style={{ background: "var(--cream)" }}>
                      {r.role && <p style={{ margin: "0 0 6px" }}><strong>Role:</strong> {r.role}</p>}
                      {r.note && <p style={{ margin: "0 0 6px", whiteSpace: "pre-line" }}><strong>{r.plan === "team" ? "What their team is carrying:" : "What would make it worth it:"}</strong> {r.note}</p>}
                      {r.heardFrom && <p style={{ margin: 0 }}><strong>Heard about us:</strong> {r.heardFrom}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
