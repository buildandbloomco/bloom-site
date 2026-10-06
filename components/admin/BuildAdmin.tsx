"use client";

import { useState } from "react";
import { BUILD_KINDS, STAGES, sectionsFor, type Build, type BuildRequest } from "@/lib/build-def";
import IntakeForm, { AccountsList } from "@/components/build/IntakeForm";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });

export default function BuildAdmin({ clientId, slug, initial }: { clientId: string; slug: string; initial: Build }) {
  const [b, setB] = useState(initial);
  const [msg, setMsg] = useState("");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [view, setView] = useState<"edit" | "read">("read");

  async function send(body: Record<string, unknown>, ok = "Saved") {
    setMsg("Saving...");
    const res = await fetch(`/api/admin/clients/${clientId}/build`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(j.error || "Not saved."); return; }
    setB(j); setMsg(ok);
  }
  const val = (k: string) => { const v = b.intake[k]; return Array.isArray(v) ? v.join(", ") : String(v ?? ""); };
  const newReqs = b.requests.filter((r) => r.status === "new").length;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="panel" style={b.enabled ? { borderTopColor: "var(--ok)" } : undefined}>
        <div className="row between" style={{ gap: 12, flexWrap: "wrap" }}>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={b.enabled} onChange={(e) => { const on = e.target.checked; setB((d) => ({ ...d, enabled: on })); send({ enabled: on }, on ? "On. They now see a Build section in their portal." : "Off. Hidden from their portal."); }} />
            <span><strong>Show the build workspace in their portal</strong></span>
          </label>
          <span className="row" style={{ gap: 10 }}>
            <span className="small" role="status">{msg}</span>
            {b.enabled && <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${clientId}/preview?to=/p/${slug}/build`} target="_blank" rel="noreferrer">See what they see &#8599;</a>}
          </span>
        </div>
        <div className="grid-3" style={{ gap: 14 }}>
          <label>What we are building<select value={b.kind} onChange={(e) => { const v = e.target.value as Build["kind"]; setB((d) => ({ ...d, kind: v })); send({ kind: v }); }}>{BUILD_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></label>
          <label>Stage<select value={b.stage} onChange={(e) => { const v = e.target.value as Build["stage"]; setB((d) => ({ ...d, stage: v })); send({ stage: v }, "Stage updated. They see it right away."); }}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label>Target launch date<input type="date" value={b.targetDate} onChange={(e) => send({ targetDate: e.target.value })} /></label>
        </div>
        <div className="grid-2" style={{ gap: 14 }}>
          <label>Preview link <span className="hint">Where they can look at the work in progress</span><input type="url" placeholder="https://" defaultValue={b.previewUrl} onBlur={(e) => e.target.value !== b.previewUrl && send({ previewUrl: e.target.value })} /></label>
          <label>Live link <span className="hint">Once it launches</span><input type="url" placeholder="https://" defaultValue={b.liveUrl} onBlur={(e) => e.target.value !== b.liveUrl && send({ liveUrl: e.target.value })} /></label>
        </div>
      </section>

      <section className="panel">
        <h3>Post an update</h3>
        <p className="small muted" style={{ margin: 0 }}>Short notes on what you finished and what you need from them. Newest shows first in their portal.</p>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Homepage design is ready for you to look at. I need your logo file by Friday." aria-label="Update" />
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <input type="url" placeholder="Link to show them (optional) https://" value={link} onChange={(e) => setLink(e.target.value)} style={{ flex: "1 1 260px" }} aria-label="Link" />
          <button type="button" className="btn btn-sm btn-dark" disabled={!text.trim()} onClick={async () => { await send({ update: { text, link } }, "Posted."); setText(""); setLink(""); }}>Post update</button>
        </div>
        {b.updates.map((u) => (
          <div className="file-row" key={u.id}>
            <div className="stack" style={{ gap: 2, flex: "1 1 260px" }}><span style={{ whiteSpace: "pre-line" }}>{u.text}</span>{u.link && <a className="small" href={u.link} target="_blank" rel="noreferrer">{u.link}</a>}<span className="tiny muted">{when(u.at)}</span></div>
            <button type="button" className="linkbtn small" onClick={() => confirm("Remove this update?") && send({ removeUpdate: u.id }, "Removed.")}>Remove</button>
          </div>
        ))}
      </section>

      <section className="panel" style={newReqs ? { borderTopColor: "var(--rust)" } : undefined}>
        <h3>Add-on requests{newReqs ? ` (${newReqs} new)` : ""}</h3>
        {b.requests.length === 0 && <p className="small muted" style={{ margin: 0 }}>None yet. Clients can ask for add-ons from their build page. You reply with a price and timing here, then add it to their proposal or invoice.</p>}
        {b.requests.map((r) => (
          <div className="stack" key={r.id} style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="row between" style={{ gap: 10 }}><strong>{r.label}</strong><span className="tiny muted">{when(r.at)}</span></div>
            {r.note && <span className="small">{r.note}</span>}
            <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ flex: "1 1 280px" }}>Your reply <span className="hint">They see this</span><input type="text" value={replies[r.id] ?? r.reply} onChange={(e) => setReplies((x) => ({ ...x, [r.id]: e.target.value }))} placeholder="Yes, that is $750 and adds one week." /></label>
              <label>Status<select value={r.status} onChange={(e) => send({ request: { id: r.id, status: e.target.value as BuildRequest["status"], reply: replies[r.id] ?? r.reply } })}><option value="new">New</option><option value="quoted">Quoted</option><option value="added">Added to build</option><option value="declined">Not adding</option></select></label>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => send({ request: { id: r.id, reply: replies[r.id] ?? r.reply, status: r.status === "new" ? "quoted" : r.status } }, "Reply saved.")}>Save reply</button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Accounts in their name</h3>
        <p className="small muted" style={{ margin: 0 }}>They check these off as they set them up. You can check them off too. Running costs are about $40 a month, paid by them directly to those companies.</p>
        <AccountsList key={b.kind} initial={b} as="us" clientId={clientId} />
      </section>

      <section className="panel">
        <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
          <div className="stack" style={{ gap: 2 }}>
            <h3 style={{ margin: 0 }}>Build questionnaire</h3>
            <span className="small muted">{b.intakeSubmittedAt ? `They sent it ${when(b.intakeSubmittedAt)}.` : "Not sent yet. They can fill it in from their portal, or you can fill it in with them on a call."}</span>
          </div>
          <div className="row no-print" style={{ gap: 8 }}>
            <button type="button" className={`btn btn-sm ${view === "read" ? "btn-dark" : "btn-ghost"}`} onClick={async () => { if (view === "edit") await send({}, ""); setView("read"); }}>Read answers</button>
            <button type="button" className={`btn btn-sm ${view === "edit" ? "btn-dark" : "btn-ghost"}`} onClick={() => setView("edit")}>Fill in or edit</button>
            {view === "read" && <button type="button" className="btn btn-sm btn-ghost" onClick={() => window.print()}>Print</button>}
          </div>
        </div>
        {view === "edit" ? <IntakeForm key={b.kind} initial={b} as="us" clientId={clientId} onChange={setB} /> : (
          <div className="stack" style={{ gap: 18 }}>
            {sectionsFor(b.kind).map((s) => (
              <div key={s.id} className="stack" style={{ gap: 8 }}>
                <span className="eyebrow">{s.title}</span>
                {s.fields.map((f) => (
                  <div key={f.key} className="small" style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                    <span className="muted">{f.label}</span>
                    <span style={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                      {f.type === "color" && val(f.key) ? <><span aria-hidden="true" style={{ display: "inline-block", width: 16, height: 16, borderRadius: 4, background: val(f.key), border: "1px solid var(--line)", verticalAlign: "-3px", marginRight: 6 }} />{val(f.key)}</>
                        : f.type === "url" && /^https?:\/\//.test(val(f.key)) ? <a href={val(f.key)} target="_blank" rel="noreferrer">{val(f.key)}</a>
                        : val(f.key) || <span className="muted">No answer yet</span>}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
