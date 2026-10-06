"use client";

import { useState } from "react";
import type { Agreement } from "@/lib/agreements";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }) + " ET" : "");

export default function AgreementsAdmin({ clientId, slug, initial }: { clientId: string; slug: string; initial: Agreement[] }) {
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState<string | null>(initial.find((a) => a.status === "draft")?.id ?? null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(body: Record<string, unknown>, ok: string) {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/admin/clients/${clientId}/agreements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong."); return null; }
    setList(j.list); setMsg(ok);
    return j.list as Agreement[];
  }
  const edit = (id: string, patch: Partial<Agreement>) => setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-dark" disabled={busy} onClick={async () => { const l = await call({ action: "create" }, "Draft created from your template. Edit it, then send."); if (l) setOpen(l[0].id); }}>+ New agreement</button>
        {msg && <span className="small" role="status">{msg}</span>}
      </div>
      {list.length === 0 && <p className="muted">No agreements yet. Start one from the template, change anything you need, and send it to their portal to sign.</p>}
      {list.map((a) => {
        const locked = a.status === "signed";
        return (
          <section className="panel" key={a.id} style={locked ? { borderTopColor: "var(--ok)" } : a.status === "sent" ? { borderTopColor: "var(--gold)" } : undefined}>
            <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
              <div className="stack" style={{ gap: 2 }}>
                <h3 style={{ margin: 0 }}>{a.title}</h3>
                <span className="small muted">
                  {locked ? `Signed by ${a.signedName}${a.signedTitle ? `, ${a.signedTitle}` : ""} on ${when(a.signedAt)}` : a.status === "sent" ? `Waiting for signature. Sent ${when(a.sentAt)}` : "Draft. The client cannot see this yet."}
                </span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className={`tag ${locked ? "green" : a.status === "sent" ? "gold" : ""}`}>{locked ? "Signed" : a.status === "sent" ? "Sent" : "Draft"}</span>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Close" : locked ? "View" : "Edit"}</button>
              </div>
            </div>
            {open === a.id && (locked ? (
              <div className="stack" style={{ gap: 12 }}>
                <div className="agree-body small">{a.body}</div>
                <p className="tiny muted" style={{ margin: 0 }}>Signed from {a.signedIp || "unknown address"}. Record ID {a.signedHash.slice(0, 16)}.</p>
                <div className="row" style={{ gap: 10 }}>
                  <a className="btn btn-sm btn-dark" href={`/api/admin/clients/${clientId}/preview?to=/p/${slug}/agreements/${a.id}`} target="_blank" rel="noreferrer">Open signed copy to print</a>
                  <button type="button" className="linkbtn small" onClick={() => { const c = prompt("Signed agreements are your record. Type DELETE to remove this one."); if (c) call({ action: "delete", id: a.id, confirm: c }, "Removed."); }}>Remove</button>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 12 }}>
                <label>Title<input type="text" value={a.title} maxLength={160} onChange={(e) => edit(a.id, { title: e.target.value })} /></label>
                <label>Agreement text <span className="hint">Plain text. Blank lines make paragraphs.</span><textarea rows={22} value={a.body} onChange={(e) => edit(a.id, { body: e.target.value })} /></label>
                <label className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                  <input type="checkbox" checked={a.requiredToPay} onChange={(e) => edit(a.id, { requiredToPay: e.target.checked })} style={{ width: "auto", marginTop: 4 }} />
                  <span>Must be signed before they can pay by card in the portal</span>
                </label>
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => call({ action: "save", id: a.id, title: a.title, body: a.body, requiredToPay: a.requiredToPay }, "Saved.")}>Save</button>
                  {a.status === "draft"
                    ? <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => call({ action: "save", id: a.id, title: a.title, body: a.body, requiredToPay: a.requiredToPay, send: true }, "Sent. It is now at the top of their portal.")}>Save and send to their portal</button>
                    : <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => call({ action: "save", id: a.id, title: a.title, body: a.body, requiredToPay: a.requiredToPay, send: false }, "Pulled back to a draft.")}>Pull back to draft</button>}
                  <button type="button" className="linkbtn small" disabled={busy} onClick={() => confirm("Delete this agreement?") && call({ action: "delete", id: a.id }, "Deleted.")}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
