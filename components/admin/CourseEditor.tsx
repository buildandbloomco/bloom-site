"use client";

import Uploader from "./Uploader";
import { useEffect, useState } from "react";
import type { Course, Lesson, Prompt, PromptType } from "@/lib/course-types";
import { FORMAT_LABEL, allLessons } from "@/lib/course-logic";
import { money } from "@/lib/format";

const rid = () => Math.random().toString(36).slice(2, 10);
type Up = (fn: (d: Course) => void) => void;

function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}
const lines = (s: string) => s.split("\n");

interface Learner {
  id: string; name: string; email: string; packageName: string; status: string;
  percent: number; done: number; total: number; sessions: string; paid: number; balance: number; newRequests: number;
}

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["curriculum", "Curriculum"],
  ["pricing", "Packages & payments"],
  ["resources", "Resources"],
  ["schedule", "Schedule"],
  ["learners", "Learners"],
];

export default function CourseEditor({
  initial, library, learners, clients, initialTab,
}: {
  initial: Course;
  library: { id: string; title: string; kind: string }[];
  learners: Learner[];
  clients: { id: string; name: string; email: string }[];
  initialTab: string;
}) {
  const [c, setC] = useState<Course>(initial);
  const [tab, setTab] = useState(TABS.some(([k]) => k === initialTab) ? initialTab : "overview");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update: Up = (fn) => {
    setC((prev) => { const next = structuredClone(prev); fn(next); return next; });
    setDirty(true);
    setMsg("");
  };

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/courses/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(data.error || "Could not save.");
    setC(data.course);
    setDirty(false);
    setMsg("Saved");
  }

  async function remove() {
    if (!confirm("Delete this course permanently?")) return;
    const res = await fetch(`/api/admin/courses/${c.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error);
    setDirty(false);
    window.location.href = "/admin/courses";
  }

  const lessonCount = allLessons(c).length;

  return (
    <>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Course · {FORMAT_LABEL[c.format]} · {c.modules.length} modules · {lessonCount} lessons</p>
          <h2>{c.title || "Untitled course"}</h2>
        </div>
        <div className="row">
          <span className={`tag ${c.status === "published" ? "green" : ""}`}>{c.status}</span>
          {c.status === "published" && <a className="btn btn-sm btn-ghost" href={`/courses/${c.slug}`} target="_blank" rel="noopener noreferrer">View course page ↗</a>}
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {label}{k === "learners" && learners.length ? ` (${learners.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview c={c} update={update} onDelete={remove} />}
      {tab === "curriculum" && <Curriculum c={c} update={update} />}
      {tab === "pricing" && <Pricing c={c} update={update} />}
      {tab === "resources" && <Resources c={c} update={update} library={library} />}
      {tab === "schedule" && <Schedule c={c} update={update} />}
      {tab === "learners" && <Learners c={c} learners={learners} clients={clients} dirty={dirty} />}

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>Save course</button>}
        </div>
      )}
    </>
  );
}

function Overview({ c, update, onDelete }: { c: Course; update: Up; onDelete: () => void }) {
  return (
    <div className="stack" style={{ gap: 20, maxWidth: 900 }}>
      <section className="panel">
        <h3>Basics</h3>
        <div className="grid-2" style={{ gap: 14 }}>
          <label>Title<input type="text" value={c.title} onChange={(e) => update((d) => void (d.title = e.target.value))} /></label>
          <label>Page address <span className="hint">/courses/{c.slug}</span><input type="text" value={c.slug} onChange={(e) => update((d) => void (d.slug = e.target.value))} /></label>
        </div>
        <label>Subtitle<input type="text" value={c.subtitle} onChange={(e) => update((d) => void (d.subtitle = e.target.value))} /></label>
        <label>Description <span className="hint">Shown on the course sales page</span><textarea value={c.description} onChange={(e) => update((d) => void (d.description = e.target.value))} /></label>
        <div className="grid-3" style={{ gap: 14 }}>
          <label>
            Format
            <select value={c.format} onChange={(e) => update((d) => void (d.format = e.target.value as Course["format"]))}>
              <option value="self-paced">Self-paced</option>
              <option value="virtual">Virtual (live online)</option>
              <option value="in-person">In person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label>
            Status
            <select value={c.status} onChange={(e) => update((d) => void (d.status = e.target.value as Course["status"]))}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published (open for enrollment)</option>
              <option value="archived">Archived (closed, learners keep access)</option>
            </select>
          </label>
          <label>Suggested pace<input type="text" placeholder="One part per week over six weeks" value={c.pace} onChange={(e) => update((d) => void (d.pace = e.target.value))} /></label>
        </div>
        <div className="checks">
          <label><input type="checkbox" checked={c.showOnSite} onChange={() => update((d) => void (d.showOnSite = !d.showOnSite))} /> List on the website&rsquo;s Courses page (when published)</label>
          <label><input type="checkbox" checked={c.printableWorkbook} onChange={() => update((d) => void (d.printableWorkbook = !d.printableWorkbook))} /> Printable workbook (learners can print blank or with their answers)</label>
          <label><input type="checkbox" checked={c.certificate} onChange={() => update((d) => void (d.certificate = !d.certificate))} /> Certificate of completion when every lesson is done</label>
        </div>
      </section>
      <section className="panel">
        <h3>Learner welcome</h3>
        <label>Welcome letter <span className="hint">First thing learners see. Blank lines start new paragraphs.</span><textarea style={{ minHeight: 200 }} value={c.welcome} onChange={(e) => update((d) => void (d.welcome = e.target.value))} /></label>
        <label>Affirmations <span className="hint">One per line. Shown on the course home and printed in the workbook.</span><textarea style={{ minHeight: 160 }} value={c.affirmations.join("\n")} onChange={(e) => update((d) => void (d.affirmations = lines(e.target.value)))} /></label>
        <label>Closing note <span className="hint">Shown when they finish</span><textarea value={c.closing} onChange={(e) => update((d) => void (d.closing = e.target.value))} /></label>
      </section>
      <button type="button" className="linkbtn danger small" style={{ alignSelf: "flex-start" }} onClick={onDelete}>Delete course</button>
    </div>
  );
}

function PromptEditor({ p, onChange, onRemove, onMove }: { p: Prompt; onChange: (fn: (x: Prompt) => void) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void }) {
  return (
    <div className="list-item" style={{ background: "var(--ivory)" }}>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <select aria-label="Question type" style={{ maxWidth: 190 }} value={p.type} onChange={(e) => onChange((x) => void (x.type = e.target.value as PromptType))}>
          <option value="short">Short answer</option>
          <option value="long">Long answer / journal</option>
          <option value="table">Fill-in table</option>
          <option value="checklist">Checklist</option>
          <option value="scale">1 to 10 scale</option>
        </select>
        <input type="text" placeholder="Question or instruction" value={p.label} onChange={(e) => onChange((x) => void (x.label = e.target.value))} />
      </div>
      <input type="text" placeholder="Helper text, journal title, or fill-in template (optional)" value={p.help} onChange={(e) => onChange((x) => void (x.help = e.target.value))} />
      {p.type === "table" && (
        <div className="grid-2" style={{ gap: 10 }}>
          <label className="small">Columns <span className="hint">separate with |</span>
            <input type="text" value={p.columns.join(" | ")} onChange={(e) => onChange((x) => void (x.columns = e.target.value.split("|").map((s) => s.trim())))} />
          </label>
          <label className="small">Row labels <span className="hint">one per line, or leave empty and set blank rows</span>
            <textarea style={{ minHeight: 70 }} value={p.rows.join("\n")} onChange={(e) => onChange((x) => void (x.rows = lines(e.target.value)))} />
          </label>
          {!p.rows.filter(Boolean).length && (
            <label className="small">Blank rows<input type="number" min={1} max={40} value={p.blankRows || 3} onChange={(e) => onChange((x) => void (x.blankRows = Number(e.target.value)))} /></label>
          )}
        </div>
      )}
      {p.type === "checklist" && (
        <label className="small">Checklist items <span className="hint">one per line</span>
          <textarea value={p.options.join("\n")} onChange={(e) => onChange((x) => void (x.options = lines(e.target.value)))} />
        </label>
      )}
      <div className="row">
        <button type="button" className="linkbtn tiny" onClick={() => onMove(-1)}>Move up</button>
        <button type="button" className="linkbtn tiny" onClick={() => onMove(1)}>Move down</button>
        <button type="button" className="linkbtn danger tiny" onClick={onRemove}>Remove question</button>
      </div>
    </div>
  );
}

function LessonEditor({ l, mi, li, update }: { l: Lesson; mi: number; li: number; update: Up }) {
  const set = (fn: (x: Lesson) => void) => update((d) => fn(d.modules[mi].lessons[li]));
  return (
    <details className="lesson-edit">
      <summary>
        <span className="small muted" style={{ width: 28 }}>{li + 1}.</span>
        <span style={{ flex: 1 }}>{l.title || "Untitled lesson"}</span>
        <span className="tiny muted">{l.prompts.length} question{l.prompts.length === 1 ? "" : "s"}{l.videoUrl ? " · video" : ""}</span>
      </summary>
      <div className="stack" style={{ gap: 12, marginTop: 12 }}>
        <div className="grid-2" style={{ gap: 12 }}>
          <label>Lesson title<input type="text" value={l.title} onChange={(e) => set((x) => void (x.title = e.target.value))} /></label>
          <label>Estimated minutes<input type="number" min={0} value={l.minutes} onChange={(e) => set((x) => void (x.minutes = Number(e.target.value)))} /></label>
        </div>
        <label>Lesson text <span className="hint">Blank lines start new paragraphs. Lines starting with • become bullets.</span>
          <textarea style={{ minHeight: 140 }} value={l.intro} onChange={(e) => set((x) => void (x.intro = e.target.value))} />
        </label>
        <div className="grid-3" style={{ gap: 12 }}>
          <label>Video or audio link <span className="hint">YouTube, Vimeo, Loom, Drive, or upload below</span><input type="url" value={l.videoUrl} onChange={(e) => set((x) => void (x.videoUrl = e.target.value.trim()))} /></label>
          <label>Download link<input type="url" placeholder="https://" value={l.resourceUrl} onChange={(e) => set((x) => void (x.resourceUrl = e.target.value.trim()))} /></label>
          <label>Download label<input type="text" placeholder="Worksheet PDF" value={l.resourceLabel} onChange={(e) => set((x) => void (x.resourceLabel = e.target.value))} /></label>
        </div>
        <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Uploader accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav" label="Upload a video or audio file" folder="courses" onDone={(url) => set((x) => void (x.videoUrl = url))} />
          <Uploader accept="application/pdf,image/png,image/jpeg" label="Upload a download (PDF or image)" folder="courses" onDone={(url) => set((x) => { x.resourceUrl = url; if (!x.resourceLabel) x.resourceLabel = "Download"; })} />
        </div>
        <label>Highlighted quote or affirmation<input type="text" value={l.callout} onChange={(e) => set((x) => void (x.callout = e.target.value))} /></label>
        <strong className="small">Workbook questions</strong>
        {l.prompts.map((p, pi) => (
          <PromptEditor
            key={p.id}
            p={p}
            onChange={(fn) => set((x) => fn(x.prompts[pi]))}
            onRemove={() => set((x) => void x.prompts.splice(pi, 1))}
            onMove={(dir) => set((x) => move(x.prompts, pi, dir))}
          />
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => set((x) => void x.prompts.push({ id: rid(), type: "long", label: "", help: "", columns: [], rows: [], blankRows: 3, options: [] }))}>+ Add question</button>
        <div className="row">
          <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.modules[mi].lessons, li, -1))}>Move lesson up</button>
          <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.modules[mi].lessons, li, 1))}>Move lesson down</button>
          <button type="button" className="linkbtn danger small" onClick={() => confirm("Remove this lesson?") && update((d) => void d.modules[mi].lessons.splice(li, 1))}>Remove lesson</button>
        </div>
      </div>
    </details>
  );
}

function Curriculum({ c, update }: { c: Course; update: Up }) {
  return (
    <div className="stack" style={{ gap: 18, maxWidth: 1000 }}>
      <p className="small muted">Modules hold lessons; lessons hold your teaching text, optional video or download, and the workbook questions learners answer online. Everything here also builds the printable workbook.</p>
      {c.modules.map((m, mi) => (
        <section className="panel" key={m.id}>
          <div className="row between">
            <span className="eyebrow">Module {mi + 1}</span>
            <div className="row">
              <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.modules, mi, -1))}>Move up</button>
              <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.modules, mi, 1))}>Move down</button>
              <button type="button" className="linkbtn danger small" onClick={() => confirm("Remove this module and its lessons?") && update((d) => void d.modules.splice(mi, 1))}>Remove</button>
            </div>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <label>Module title<input type="text" value={m.title} onChange={(e) => update((d) => void (d.modules[mi].title = e.target.value))} /></label>
            <label>Summary<input type="text" value={m.summary} onChange={(e) => update((d) => void (d.modules[mi].summary = e.target.value))} /></label>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {m.lessons.map((l, li) => <LessonEditor key={l.id} l={l} mi={mi} li={li} update={update} />)}
          </div>
          <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.modules[mi].lessons.push({ id: rid(), title: "New lesson", intro: "", videoUrl: "", resourceUrl: "", resourceLabel: "", callout: "", prompts: [], minutes: 15 }))}>+ Add lesson</button>
        </section>
      ))}
      <button type="button" className="btn btn-dark" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.modules.push({ id: rid(), title: "New module", summary: "", lessons: [] }))}>+ Add module</button>
    </div>
  );
}

function Pricing({ c, update }: { c: Course; update: Up }) {
  return (
    <div className="stack" style={{ gap: 20, maxWidth: 1000 }}>
      <section className="stack" style={{ gap: 12 }}>
        <div className="row between">
          <div className="stack" style={{ gap: 2 }}>
            <h3>Packages</h3>
            <p className="small muted">Each package is a way to take the course. Set how many 1:1 sessions with you it includes.</p>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => update((d) => void d.packages.push({ id: rid(), name: "New package", description: "", includes: [], price: 0, monthly: false, sessions: 0, sessionMinutes: 60, format: "", planIds: [], featured: false, active: true }))}>+ Add package</button>
        </div>
        {c.packages.map((p, i) => (
          <div className="panel" key={p.id}>
            <div className="grid-3" style={{ gap: 12 }}>
              <label>Name<input type="text" value={p.name} onChange={(e) => update((d) => void (d.packages[i].name = e.target.value))} /></label>
              <label>Price ($){p.monthly ? " per month" : ""}<input type="number" min={0} step="0.01" value={p.price} onChange={(e) => update((d) => void (d.packages[i].price = Number(e.target.value)))} /></label>
              <label>Format label<input type="text" placeholder="3 sessions over 3 to 4 weeks" value={p.format} onChange={(e) => update((d) => void (d.packages[i].format = e.target.value))} /></label>
              <label>1:1 sessions included{p.monthly ? " (per month)" : ""}<input type="number" min={0} value={p.sessions} onChange={(e) => update((d) => void (d.packages[i].sessions = Number(e.target.value)))} /></label>
              <label>Session length (minutes)<input type="number" min={0} value={p.sessionMinutes} onChange={(e) => update((d) => void (d.packages[i].sessionMinutes = Number(e.target.value)))} /></label>
              <label>Short description<input type="text" value={p.description} onChange={(e) => update((d) => void (d.packages[i].description = e.target.value))} /></label>
            </div>
            <label>What&rsquo;s included <span className="hint">one per line</span><textarea value={p.includes.join("\n")} onChange={(e) => update((d) => void (d.packages[i].includes = lines(e.target.value)))} /></label>
            <div className="checks" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              <label><input type="checkbox" checked={p.monthly} onChange={() => update((d) => void (d.packages[i].monthly = !d.packages[i].monthly))} /> Billed monthly (retainer)</label>
              <label><input type="checkbox" checked={p.featured} onChange={() => update((d) => void (d.packages[i].featured = !d.packages[i].featured))} /> Highlight as most popular</label>
              <label><input type="checkbox" checked={p.active} onChange={() => update((d) => void (d.packages[i].active = !d.packages[i].active))} /> Available</label>
              {!p.monthly && c.plans.map((pl) => (
                <label key={pl.id}><input type="checkbox" checked={p.planIds.includes(pl.id)} onChange={() => update((d) => { const ids = d.packages[i].planIds; d.packages[i].planIds = ids.includes(pl.id) ? ids.filter((x) => x !== pl.id) : [...ids, pl.id]; })} /> Allow {pl.label.toLowerCase()} ({money(Math.round((p.price / pl.installments) * 100) / 100)} each)</label>
              ))}
            </div>
            <div className="row">
              <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.packages, i, -1))}>Move up</button>
              <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.packages, i, 1))}>Move down</button>
              <button type="button" className="linkbtn danger small" onClick={() => confirm("Remove this package?") && update((d) => void d.packages.splice(i, 1))}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Payment plans</h3>
        <p className="small muted">Learners always see &ldquo;Pay in full.&rdquo; Plans split one-time packages into equal payments; they pay the first at checkout and the rest from their course page. Klarna, Afterpay, and Affirm also appear at checkout if you turn them on in Stripe.</p>
        {c.plans.map((pl, i) => (
          <div className="row" key={pl.id} style={{ flexWrap: "nowrap" }}>
            <input type="text" aria-label="Plan name" value={pl.label} onChange={(e) => update((d) => void (d.plans[i].label = e.target.value))} />
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>Payments<input type="number" min={2} max={24} style={{ width: 80 }} value={pl.installments} onChange={(e) => update((d) => void (d.plans[i].installments = Number(e.target.value)))} /></label>
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>Every<input type="number" min={1} style={{ width: 80 }} value={pl.intervalDays} onChange={(e) => update((d) => void (d.plans[i].intervalDays = Number(e.target.value)))} />days</label>
            <button type="button" className="linkbtn danger small" onClick={() => update((d) => { d.plans.splice(i, 1); d.packages.forEach((p) => (p.planIds = p.planIds.filter((x) => x !== pl.id))); })}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.plans.push({ id: rid(), label: "4 payments every 2 weeks", installments: 4, intervalDays: 14 }))}>+ Add payment plan</button>
      </section>

      <section className="panel">
        <h3>Add-ons</h3>
        {c.addOns.map((a, i) => (
          <div className="grid-3" key={a.id} style={{ gap: 10, borderTop: i ? "1px solid var(--line)" : undefined, paddingTop: i ? 10 : 0 }}>
            <label>Name<input type="text" value={a.name} onChange={(e) => update((d) => void (d.addOns[i].name = e.target.value))} /></label>
            <label>Price ($)<input type="number" min={0} value={a.price} onChange={(e) => update((d) => void (d.addOns[i].price = Number(e.target.value)))} /></label>
            <label>Adds 1:1 sessions<input type="number" min={0} value={a.sessions} onChange={(e) => update((d) => void (d.addOns[i].sessions = Number(e.target.value)))} /></label>
            <label style={{ gridColumn: "1 / -1" }}>Description<input type="text" value={a.description} onChange={(e) => update((d) => void (d.addOns[i].description = e.target.value))} /></label>
            <button type="button" className="linkbtn danger small" style={{ justifySelf: "start" }} onClick={() => update((d) => void d.addOns.splice(i, 1))}>Remove add-on</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.addOns.push({ id: rid(), name: "", description: "", price: 0, sessions: 0 }))}>+ Add add-on</button>
      </section>

      <section className="panel">
        <h3>Discount codes</h3>
        <p className="small muted">For scholarships, early birds, partners, and community pricing.</p>
        {c.coupons.map((cp, i) => (
          <div className="row" key={i} style={{ flexWrap: "wrap" }}>
            <input type="text" aria-label="Code" placeholder="CODE" style={{ maxWidth: 160, textTransform: "uppercase" }} value={cp.code} onChange={(e) => update((d) => void (d.coupons[i].code = e.target.value.toUpperCase()))} />
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>% off<input type="number" min={0} max={100} style={{ width: 80 }} value={cp.percentOff} onChange={(e) => update((d) => void (d.coupons[i].percentOff = Number(e.target.value)))} /></label>
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>$ off<input type="number" min={0} style={{ width: 90 }} value={cp.amountOff} onChange={(e) => update((d) => void (d.coupons[i].amountOff = Number(e.target.value)))} /></label>
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>Max uses<input type="number" min={0} style={{ width: 80 }} value={cp.maxUses} onChange={(e) => update((d) => void (d.coupons[i].maxUses = Number(e.target.value)))} /></label>
            <span className="small muted">Used {cp.uses}</span>
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><input type="checkbox" checked={cp.active} onChange={() => update((d) => void (d.coupons[i].active = !d.coupons[i].active))} /> Active</label>
            <button type="button" className="linkbtn danger small" onClick={() => update((d) => void d.coupons.splice(i, 1))}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.coupons.push({ code: "", percentOff: 10, amountOff: 0, active: true, maxUses: 0, uses: 0 }))}>+ Add code</button>
      </section>
    </div>
  );
}

function Resources({ c, update, library }: { c: Course; update: Up; library: { id: string; title: string; kind: string }[] }) {
  return (
    <div className="stack" style={{ gap: 20, maxWidth: 900 }}>
      <section className="panel">
        <h3>Digital products included</h3>
        <p className="small muted">Items from your Library that every learner in this course gets.</p>
        <div className="checks">
          {library.map((l) => (
            <label key={l.id}><input type="checkbox" checked={c.libraryIds.includes(l.id)} onChange={() => update((d) => void (d.libraryIds = d.libraryIds.includes(l.id) ? d.libraryIds.filter((x) => x !== l.id) : [...d.libraryIds, l.id]))} /> {l.title} <span className="hint">{l.kind}</span></label>
          ))}
          {!library.length && <p className="small muted">Add products in Admin &gt; Library first.</p>}
        </div>
      </section>
      <section className="panel">
        <h3>Course downloads &amp; links</h3>
        <p className="small muted">Templates, slides, recordings, or a PDF version of the workbook.</p>
        {c.resources.map((r, i) => (
          <div className="list-item" key={i}>
            <input type="text" placeholder="Title" value={r.title} onChange={(e) => update((d) => void (d.resources[i].title = e.target.value))} />
            <input type="url" placeholder="https://" value={r.url} onChange={(e) => update((d) => void (d.resources[i].url = e.target.value))} />
            <input type="text" placeholder="Note (optional)" value={r.note} onChange={(e) => update((d) => void (d.resources[i].note = e.target.value))} />
            <button type="button" className="linkbtn danger small" style={{ justifySelf: "start" }} onClick={() => update((d) => void d.resources.splice(i, 1))}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.resources.push({ title: "", url: "", note: "" }))}>+ Add download or link</button>
      </section>
    </div>
  );
}

function Schedule({ c, update }: { c: Course; update: Up }) {
  return (
    <section className="panel" style={{ maxWidth: 1000 }}>
      <h3>Live sessions</h3>
      <p className="small muted">
        {c.format === "self-paced"
          ? "Self-paced courses usually have no group sessions, but you can add optional live Q&As here."
          : "Class dates for virtual or in-person cohorts. They appear on your calendar and on every learner's course page."}
      </p>
      {c.liveSessions.map((s, i) => (
        <div className="list-item" key={s.id}>
          <div className="grid-3" style={{ gap: 10 }}>
            <label>Title<input type="text" value={s.title} onChange={(e) => update((d) => void (d.liveSessions[i].title = e.target.value))} /></label>
            <label>Date<input type="date" value={s.date} onChange={(e) => update((d) => void (d.liveSessions[i].date = e.target.value))} /></label>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <label style={{ flex: 1 }}>Start<input type="time" value={s.start} onChange={(e) => update((d) => void (d.liveSessions[i].start = e.target.value))} /></label>
              <label style={{ flex: 1 }}>End<input type="time" value={s.end} onChange={(e) => update((d) => void (d.liveSessions[i].end = e.target.value))} /></label>
            </div>
            <label>Location<input type="text" placeholder="Address or room" value={s.location} onChange={(e) => update((d) => void (d.liveSessions[i].location = e.target.value))} /></label>
            <label>Meeting link<input type="url" placeholder="Zoom or Meet link" value={s.link} onChange={(e) => update((d) => void (d.liveSessions[i].link = e.target.value))} /></label>
            <label>Notes<input type="text" value={s.notes} onChange={(e) => update((d) => void (d.liveSessions[i].notes = e.target.value))} /></label>
          </div>
          <button type="button" className="linkbtn danger small" style={{ justifySelf: "start" }} onClick={() => update((d) => void d.liveSessions.splice(i, 1))}>Remove session</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => update((d) => void d.liveSessions.push({ id: rid(), title: `Session ${d.liveSessions.length + 1}`, date: "", start: "18:00", end: "19:30", location: "", link: "", notes: "" }))}>+ Add live session</button>
    </section>
  );
}

function Learners({ c, learners, clients, dirty }: { c: Course; learners: Learner[]; clients: { id: string; name: string; email: string }[]; dirty: boolean }) {
  const [f, setF] = useState({ clientId: "", name: "", email: "", packageId: c.packages[0]?.id ?? "", planId: "", payment: "paid", method: "Invoice" });
  const [msg, setMsg] = useState("");
  const pkg = c.packages.find((p) => p.id === f.packageId);
  async function enroll(e: React.FormEvent) {
    e.preventDefault();
    if (dirty) return setMsg("Save your course changes first.");
    const res = await fetch(`/api/admin/courses/${c.id}/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error || "Could not enroll.");
    window.location.href = `/admin/courses/${c.id}/learners/${data.enrollmentId}`;
  }
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Learner</th><th>Package</th><th>Progress</th><th>1:1 sessions</th><th>Paid</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead>
          <tbody>
            {!learners.length && <tr><td colSpan={7} className="muted">No learners yet. Enroll someone below, or publish the course so people can enroll from your website.</td></tr>}
            {learners.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.name}</strong><div className="tiny muted">{l.email}</div></td>
                <td className="small">{l.packageName}</td>
                <td style={{ minWidth: 140 }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="small">{l.percent}% · {l.done}/{l.total} lessons</span>
                    <div className="bar sm"><span style={{ width: `${l.percent}%` }} /></div>
                  </div>
                </td>
                <td className="small">{l.sessions}{l.newRequests ? <div><span className="tag rust">{l.newRequests} request</span></div> : null}</td>
                <td className="small">{money(l.paid)}{l.balance > 0 && <div className="tiny muted">{money(l.balance)} left</div>}</td>
                <td><span className={`tag ${l.status === "active" ? "green" : l.status === "completed" ? "gold" : ""}`}>{l.status}</span></td>
                <td><a className="btn btn-sm btn-ghost" href={`/admin/courses/${c.id}/learners/${l.id}`}>Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="panel" onSubmit={enroll} style={{ maxWidth: 900 }}>
        <h3>Enroll someone</h3>
        <p className="small muted">For people who paid another way, scholarships, or existing clients. They get the course in their client portal.</p>
        <label>
          Existing client <span className="hint">or leave blank and add a new person</span>
          <select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">New person</option>
            {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}{cl.email ? ` (${cl.email})` : ""}</option>)}
          </select>
        </label>
        {!f.clientId && (
          <div className="grid-2" style={{ gap: 12 }}>
            <label>Name<input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          </div>
        )}
        <div className="grid-3" style={{ gap: 12 }}>
          <label>
            Package
            <select value={f.packageId} onChange={(e) => setF({ ...f, packageId: e.target.value, planId: "" })}>
              {c.packages.map((p) => <option key={p.id} value={p.id}>{p.name} ({money(p.price)}{p.monthly ? "/mo" : ""})</option>)}
            </select>
          </label>
          <label>
            Payment
            <select value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })}>
              <option value="paid">Paid in full</option>
              {pkg && !pkg.monthly && pkg.planIds.length > 0 && <option value="first">First payment of a plan made</option>}
              <option value="comped">Complimentary / scholarship</option>
              <option value="pending">Not paid yet (no access until activated)</option>
            </select>
          </label>
          {f.payment === "first" && pkg ? (
            <label>
              Plan
              <select value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })}>
                <option value="">Choose</option>
                {c.plans.filter((pl) => pkg.planIds.includes(pl.id)).map((pl) => <option key={pl.id} value={pl.id}>{pl.label}</option>)}
              </select>
            </label>
          ) : (
            <label>
              Paid by
              <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
                {["Invoice", "Zelle", "Cash App", "Check", "Cash", "Stripe", "Other"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
          )}
        </div>
        {msg && <p className="error-text">{msg}</p>}
        <button className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }} disabled={!c.packages.length}>Enroll</button>
      </form>
    </div>
  );
}
