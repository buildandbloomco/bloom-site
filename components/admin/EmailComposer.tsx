"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { personalize, renderEmail, type EmailBrand } from "@/lib/email-template";

type Btn = { kind: "event" | "book" | "portal" | "shop" | "custom"; label: string; url: string; slug: string };
export type Draft = {
  subject: string; preheader: string; eyebrow: string; heading: string; body: string; signoff: string;
  photo: "none" | "event" | "custom"; photoEvent: string; photoUrl: string;
  buttons: Btn[];
  mode: "group" | "people"; groupId: string; emails: string[];
};
type Person = { name: string; email: string; first: string; tag?: string };
type Group = { id: string; label: string; hint: string; people: Person[]; unsub: number };
type Ev = { slug: string; name: string; details: string; image: string; open: boolean; public: boolean };

const blankBtn = (kind: Btn["kind"] = "event"): Btn => ({ kind, label: "", url: "", slug: "" });
const BLANK: Draft = { subject: "", preheader: "", eyebrow: "", heading: "", body: "", signoff: "With love,\nJadon", photo: "none", photoEvent: "", photoUrl: "", buttons: [], mode: "group", groupId: "", emails: [] };

/** Ready-made starting points. Every one can be changed before sending. */
function starters(events: Ev[]): { id: string; name: string; make: () => Partial<Draft> }[] {
  const ev = events.find((e) => e.open && e.public) ?? events.find((e) => e.open) ?? events[0];
  const evBtn = (label: string): Btn => ({ kind: "event", label, url: ev ? `/event/${ev.slug}` : "", slug: ev?.slug ?? "" });
  return [
    { id: "announce", name: "Event announcement", make: () => ({
      subject: ev ? `You're invited: ${ev.name}` : "You're invited", preheader: ev?.details || "", eyebrow: ev?.name || "You're invited",
      heading: ev ? `Come to ${ev.name}` : "You're invited",
      body: `Hi {first_name},\n\nI'd love for you to join me${ev?.details ? ` on ${ev.details.split(" · ")[0]}` : ""}. [Tell them what the day is, who it's for, and how they'll feel when they leave.]\n\n**Seats are limited**, so save yours while you can.`,
      photo: ev?.image ? "event" : "none", photoEvent: ev?.slug ?? "", buttons: [evBtn("Save your seat")], mode: "group", groupId: "leads",
    }) },
    { id: "reminder", name: "Event reminder for guests", make: () => ({
      subject: ev ? `See you soon at ${ev.name}` : "See you soon", preheader: "Everything you need for the day", eyebrow: ev?.name || "",
      heading: "We're almost there, {first_name}",
      body: `I'm so glad you're coming${ev?.details ? `. Here are the details:\n\n**${ev.details}**` : "."}\n\n[What to bring, parking, what to wear, and anything else they should know.]\n\nYour ticket and everything for the day are in your guest pass.`,
      photo: ev?.image ? "event" : "none", photoEvent: ev?.slug ?? "", buttons: [{ kind: "portal", label: "Open your guest pass", url: "/portal", slug: "" }], mode: "group", groupId: ev ? `event:${ev.slug}` : "",
    }) },
    { id: "newsletter", name: "Newsletter", make: () => ({
      subject: "A note from Jadon", preheader: "What's growing this month", eyebrow: "From Jadon",
      heading: "What's growing this month",
      body: "Hi {first_name},\n\n[Open with what's on your heart this month.]\n\n**What's new:** [an event, a guide, a win to share]\n\n**One thing to try this week:** [a small practice or reflection]\n\nAs always, I'm cheering you on.",
      buttons: ev ? [evBtn("See what's coming up")] : [], mode: "group", groupId: "everyone",
    }) },
    { id: "call", name: "Invite to book a call", make: () => ({
      subject: "Let's talk about what's next", preheader: "A free call to plan your next step", eyebrow: "Your next step",
      heading: "Let's talk, {first_name}",
      body: "I'd love to hear where you are and where you want to go. In a short call we'll name your one priority and the next step that moves it forward.\n\nPick any time that works for you.",
      buttons: [{ kind: "book", label: "Book a call", url: "", slug: "" }], mode: "group", groupId: "leads",
    }) },
    { id: "blank", name: "Start blank", make: () => ({ ...BLANK }) },
  ];
}

export default function EmailComposer({ brand, from, testTo, initial, groups, people, events, products, bookUrl }: {
  brand: EmailBrand; from: string; testTo: string; initial: Draft | null; groups: Group[]; people: Person[]; events: Ev[]; products: { slug: string; title: string }[]; bookUrl: string;
}) {
  const [d, setD] = useState<Draft>({ ...BLANK, ...(initial ?? {}) });
  const [find, setFind] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState(testTo);
  const up = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  // A button's link follows its kind, so it always points at the right page
  const linkFor = (b: Btn) => b.kind === "event" ? (b.slug ? `/event/${b.slug}` : "") : b.kind === "book" ? bookUrl : b.kind === "portal" ? "/portal" : b.kind === "shop" ? (b.slug ? `/shop/${b.slug}` : "/shop") : b.url;
  const buttons = d.buttons.map((b) => ({ label: b.label, url: linkFor(b) }));
  const image = d.photo === "event" ? events.find((e) => e.slug === d.photoEvent)?.image || "" : d.photo === "custom" ? d.photoUrl : "";
  const content = { subject: d.subject, preheader: d.preheader, eyebrow: d.eyebrow, heading: d.heading, body: d.body, signoff: d.signoff, buttons, image };

  const group = groups.find((g) => g.id === d.groupId);
  const recipients: Person[] = d.mode === "group" ? group?.people ?? [] : d.emails.map((e) => people.find((p) => p.email.toLowerCase() === e.toLowerCase()) ?? { name: e, email: e, first: e.split("@")[0] });
  const sample = recipients[0]?.first || "Tasha";

  const preview = useMemo(() => renderEmail(brand, {
    ...content, body: personalize(content.body || "Your message will show here.", sample), heading: personalize(content.heading, sample), preheader: personalize(content.preheader, sample), unsubscribeUrl: "#",
  }).html, [JSON.stringify(content), sample]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save the draft as you go
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", draft: d }) }); }, 1200);
    return () => clearTimeout(t);
  }, [d]);

  async function call(body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    return { r, j };
  }
  async function sendTest() {
    const { r, j } = await call({ action: "test", to: test, first: sample });
    setMsg(r.ok ? { ok: true, text: `Test sent to ${j.to}. Check your inbox.` } : { ok: false, text: j.error || "The test didn't send." });
  }
  async function send() {
    const n = recipients.length;
    if (!confirm(`Send "${d.subject}" to ${n} ${n === 1 ? "person" : "people"}? This can't be undone.`)) return;
    const { r, j } = await call({ action: "send", ...(d.mode === "group" ? { audienceId: d.groupId } : { emails: d.emails }), confirmCount: n });
    if (!r.ok) return setMsg({ ok: false, text: j.error || "That didn't send." });
    setMsg({ ok: true, text: `Sent to ${j.sent} ${j.sent === 1 ? "person" : "people"}.${j.skipped ? ` ${j.skipped} unsubscribed and were left off.` : ""}${j.failed?.length ? ` ${j.failed.length} didn't go through: ${j.failed.join(", ")}.` : ""}` });
    setTimeout(() => window.location.reload(), 2500);
  }
  function addPerson(v: string) {
    const hit = people.find((p) => `${p.name} <${p.email}>` === v || p.email.toLowerCase() === v.trim().toLowerCase());
    const email = hit?.email ?? v.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (!d.emails.some((e) => e.toLowerCase() === email.toLowerCase())) up({ emails: [...d.emails, email] });
    setFind("");
  }
  const ready = !!d.subject.trim() && !!d.body.trim() && recipients.length > 0 && buttons.every((b) => b.label.trim() && b.url);

  return (
    <div className="email-grid">
      <div className="stack" style={{ gap: 18 }}>
        <section className="panel stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>Start from</h3>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {starters(events).map((s) => <button key={s.id} type="button" className="chip" onClick={() => { if (d.body.trim() && !confirm("Replace what you've written with this starter?")) return; setD({ ...BLANK, ...s.make() }); }}>{s.name}</button>)}
          </div>
        </section>

        <section className="panel stack" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>Who it goes to</h3>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className={`chip ${d.mode === "group" ? "on" : ""}`} onClick={() => up({ mode: "group" })}>A group</button>
            <button type="button" className={`chip ${d.mode === "people" ? "on" : ""}`} onClick={() => up({ mode: "people" })}>Specific people</button>
          </div>
          {d.mode === "group" ? (
            <>
              <select value={d.groupId} onChange={(e) => up({ groupId: e.target.value })}>
                <option value="">Choose a group…</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.label} ({g.people.length})</option>)}
              </select>
              {group && <p className="tiny muted" style={{ margin: 0 }}>{group.hint}{group.unsub ? ` ${group.unsub} unsubscribed and won't get it.` : ""}</p>}
              {group && group.people.length > 0 && <details><summary className="small" style={{ cursor: "pointer" }}>See the {group.people.length} {group.people.length === 1 ? "person" : "people"}</summary><p className="small" style={{ margin: "8px 0 0" }}>{group.people.map((p) => p.name).join(", ")}</p></details>}
            </>
          ) : (
            <>
              <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                <input list="email-people" placeholder="Type a name or email" value={find} onChange={(e) => { setFind(e.target.value); if (people.some((p) => `${p.name} <${p.email}>` === e.target.value)) addPerson(e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerson(find); } }} />
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => addPerson(find)}>Add</button>
              </div>
              <datalist id="email-people">{people.map((p) => <option key={p.email} value={`${p.name} <${p.email}>`}>{p.tag}</option>)}</datalist>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                {d.emails.map((e) => <span key={e} className="tag" style={{ textTransform: "none", letterSpacing: 0 }}>{people.find((p) => p.email.toLowerCase() === e.toLowerCase())?.name || e} <button type="button" className="linkbtn" aria-label={`Remove ${e}`} onClick={() => up({ emails: d.emails.filter((x) => x !== e) })}>×</button></span>)}
              </div>
            </>
          )}
        </section>

        <section className="panel stack" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>The email</h3>
          <label>Subject<input type="text" maxLength={160} value={d.subject} onChange={(e) => up({ subject: e.target.value })} /></label>
          <label>Preview line <span className="hint">the gray text after the subject in the inbox</span><input type="text" maxLength={200} value={d.preheader} onChange={(e) => up({ preheader: e.target.value })} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <label>Small line above the heading<input type="text" maxLength={60} value={d.eyebrow} onChange={(e) => up({ eyebrow: e.target.value })} /></label>
            <label>Heading<input type="text" maxLength={140} value={d.heading} onChange={(e) => up({ heading: e.target.value })} /></label>
          </div>
          <label>Photo
            <select value={d.photo} onChange={(e) => up({ photo: e.target.value as Draft["photo"] })}>
              <option value="none">No photo</option>
              <option value="event">An event&rsquo;s photo</option>
              <option value="custom">A photo link</option>
            </select>
          </label>
          {d.photo === "event" && <select value={d.photoEvent} onChange={(e) => up({ photoEvent: e.target.value })}><option value="">Choose an event…</option>{events.filter((e) => e.image).map((e) => <option key={e.slug} value={e.slug}>{e.name}{e.details ? ` · ${e.details.split(" · ")[0]}` : ""}</option>)}</select>}
          {d.photo === "custom" && <input type="url" placeholder="https://… or /events/photo.jpg" value={d.photoUrl} onChange={(e) => up({ photoUrl: e.target.value })} />}
          <label>Message
            <textarea rows={12} value={d.body} onChange={(e) => up({ body: e.target.value })} />
            <span className="tiny muted">Leave a blank line between paragraphs. <strong>{"{first_name}"}</strong> becomes each person&rsquo;s first name. **two stars** makes text bold. [words](https://link) makes a link.</span>
          </label>
          <label>Sign-off<textarea rows={2} value={d.signoff} onChange={(e) => up({ signoff: e.target.value })} /></label>
        </section>

        <section className="panel stack" style={{ gap: 12 }}>
          <div className="row between"><h3 style={{ margin: 0 }}>Buttons</h3>{d.buttons.length < 2 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => up({ buttons: [...d.buttons, blankBtn(d.buttons.length ? "book" : "event")] })}>+ Add a button</button>}</div>
          {d.buttons.length === 0 && <p className="tiny muted" style={{ margin: 0 }}>Add up to two. The first one is the big filled button.</p>}
          {d.buttons.map((b, i) => {
            const set = (p: Partial<Btn>) => up({ buttons: d.buttons.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return (
              <div key={i} className="stack" style={{ gap: 8, borderTop: i ? "1px solid var(--line)" : 0, paddingTop: i ? 12 : 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <label>Goes to
                    <select value={b.kind} onChange={(e) => { const kind = e.target.value as Btn["kind"]; set({ kind, slug: "", label: b.label || ({ event: "Save your seat", book: "Book a call", portal: "Open your portal", shop: "Shop now", custom: "" } as const)[kind] }); }}>
                      <option value="event">An event page</option>
                      <option value="book">Booking a call or session</option>
                      <option value="portal">Their portal or guest pass</option>
                      <option value="shop">The shop</option>
                      <option value="custom">Any link</option>
                    </select>
                  </label>
                  {b.kind === "event" && <label>Event<select value={b.slug} onChange={(e) => set({ slug: e.target.value })}><option value="">Choose…</option>{events.map((e) => <option key={e.slug} value={e.slug}>{e.name}{e.public ? "" : " (private, room code)"}</option>)}</select></label>}
                  {b.kind === "shop" && <label>Product<select value={b.slug} onChange={(e) => set({ slug: e.target.value })}><option value="">The whole shop</option>{products.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select></label>}
                  {b.kind === "custom" && <label>Link<input type="url" placeholder="https://…" value={b.url} onChange={(e) => set({ url: e.target.value })} /></label>}
                  <label>Button words<input type="text" maxLength={40} value={b.label} onChange={(e) => set({ label: e.target.value })} /></label>
                </div>
                <div className="row between"><span className="tiny muted">{linkFor(b) ? `Opens ${linkFor(b).startsWith("/") ? brand.origin + linkFor(b) : linkFor(b)}` : "Choose where it goes"}</span><button type="button" className="linkbtn danger small" onClick={() => up({ buttons: d.buttons.filter((_, j) => j !== i) })}>Remove</button></div>
              </div>
            );
          })}
        </section>

        <section className="panel stack" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>Send</h3>
          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
            <input type="email" value={test} onChange={(e) => setTest(e.target.value)} placeholder="Your email" />
            <button type="button" className="btn btn-sm btn-ghost" disabled={busy || !d.subject.trim() || !d.body.trim()} onClick={sendTest}>Send me a test</button>
          </div>
          <button type="button" className="btn btn-primary" disabled={busy || !ready} onClick={send}>{busy ? "Sending…" : `Send to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}`}</button>
          {!ready && <p className="tiny muted" style={{ margin: 0 }}>{!d.subject.trim() ? "Add a subject. " : ""}{!d.body.trim() ? "Write a message. " : ""}{!recipients.length ? "Choose who it goes to. " : ""}{buttons.some((b) => !b.label.trim() || !b.url) ? "Finish your buttons." : ""}</p>}
          {msg && <p className={msg.ok ? "ok-text" : "error-text"} role="status" style={{ margin: 0 }}>{msg.text}</p>}
          <p className="tiny muted" style={{ margin: 0 }}>Sent from {from || "your email address in Vercel"}. Every email has an unsubscribe link, and people who unsubscribe are left off automatically. Your draft saves as you type.</p>
        </section>
      </div>

      <div className="email-preview">
        <div className="row between" style={{ marginBottom: 8 }}><strong className="small">Preview</strong><span className="tiny muted">As {sample} will see it</span></div>
        <div className="email-inbox small"><strong>{personalize(d.subject || "Subject", sample)}</strong> <span className="muted">{personalize(d.preheader, sample)}</span></div>
        <iframe title="Email preview" srcDoc={preview} className="email-frame" />
      </div>
    </div>
  );
}
