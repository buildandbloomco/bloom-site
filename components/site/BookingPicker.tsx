"use client";
import "./booking.css";

import { useMemo, useState } from "react";
import { fmtTime, longDate, type DaySlots } from "@/lib/booking";

type Lane = "orgs" | "business" | "other";

interface Props {
  days: DaySlots[];
  mode: "consult" | "learner" | "client";
  minutes: number;
  title: string;
  where: string;
  eid: string;
  type: string;
  initial: { name: string; email: string; lane: Lane };
  email: string;
}

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  for (let d = 1; d <= count; d++) cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function BookingPicker({ days, mode, minutes, title, where, eid, type, initial, email: contactEmail }: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d.times])), [days]);
  const months = useMemo(() => {
    const set = new Map<string, [number, number]>();
    for (const d of days) {
      const [y, m] = d.date.split("-").map(Number);
      set.set(`${y}-${m}`, [y, m - 1]);
    }
    return [...set.values()];
  }, [days]);
  const [mi, setMi] = useState(0);
  const [date, setDate] = useState(days[0]?.date ?? "");
  const [time, setTime] = useState("");
  const [f, setF] = useState({ name: initial.name, email: initial.email, phone: "", organization: "", role: "", lane: initial.lane, topic: "", company_url: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!days.length) {
    return (
      <div className="card stack" style={{ maxWidth: 620, gap: 12 }}>
        <h3>No open times right now</h3>
        <p className="muted">
          The calendar is full for the next few weeks. {contactEmail ? <>Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we will find a time together.</> : "Please check back soon."}
        </p>
      </div>
    );
  }

  const [y, m] = months[Math.min(mi, months.length - 1)];
  const monthLabel = new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const times = byDate.get(date) ?? [];
  const localTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return setErr("Pick a day and time first.");
    setBusy(true);
    setErr("");
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, date, time, eid, type }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      window.location.href = `/book/confirmed?id=${data.id}&t=${data.token}`;
      return;
    }
    setBusy(false);
    setErr(data.error || "Something went wrong. Please try again.");
    if (res.status === 409) setTime("");
  }

  return (
    <div className="book-grid">
      <div className="panel book-cal">
        <div className="row between">
          <h3 style={{ margin: 0 }}>{monthLabel}</h3>
          {months.length > 1 && (
            <div className="row" style={{ gap: 6 }}>
              <button type="button" className="btn btn-sm btn-ghost" aria-label="Previous month" disabled={mi === 0} onClick={() => setMi(mi - 1)}>←</button>
              <button type="button" className="btn btn-sm btn-ghost" aria-label="Next month" disabled={mi >= months.length - 1} onClick={() => setMi(mi + 1)}>→</button>
            </div>
          )}
        </div>
        <div className="book-month" role="grid" aria-label={monthLabel}>
          {WEEK.map((w) => <span key={w} className="book-wd" aria-hidden="true">{w}</span>)}
          {monthCells(y, m).map((d, i) =>
            d ? (
              <button
                key={d}
                type="button"
                className={`book-day${byDate.has(d) ? " open" : ""}${d === date ? " on" : ""}`}
                disabled={!byDate.has(d)}
                aria-pressed={d === date}
                aria-label={`${longDate(d)}${byDate.has(d) ? ", times available" : ", unavailable"}`}
                onClick={() => { setDate(d); setTime(""); }}
              >
                {Number(d.slice(8))}
              </button>
            ) : <span key={`x${i}`} />
          )}
        </div>
        <p className="tiny muted">Times are Eastern Time{localTz && localTz !== "America/New_York" ? ` (you appear to be in ${localTz.replace(/_/g, " ")})` : ""}.</p>
      </div>

      <div className="stack" style={{ gap: 20, minWidth: 0 }}>
        <div className="panel">
          <h3 style={{ margin: 0 }}>{date ? longDate(date) : "Pick a day"}</h3>
          <div className="book-times">
            {times.map((t) => (
              <button key={t} type="button" className={`btn btn-sm ${t === time ? "btn-primary" : "btn-ghost"}`} aria-pressed={t === time} onClick={() => setTime(t)}>
                {fmtTime(t)}
              </button>
            ))}
          </div>
        </div>

        {time && (
          <form className="panel" onSubmit={submit}>
            <div className="book-summary">
              <strong>{title}</strong>
              <span>{longDate(date)} · {fmtTime(time)} ET · {minutes} minutes</span>
              {where && <span className="small muted">{where}</span>}
            </div>
            <label className="hp" aria-hidden="true">Leave this empty<input type="text" tabIndex={-1} autoComplete="off" value={f.company_url} onChange={set("company_url")} /></label>
            {mode === "consult" && (
              <>
                <div className="grid-2" style={{ gap: 12 }}>
                  <label>Your name<input type="text" required value={f.name} onChange={set("name")} autoComplete="name" /></label>
                  <label>Email<input type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
                  <label>Phone <span className="hint">optional</span><input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
                  <label>Organization or business <span className="hint">optional</span><input type="text" value={f.organization} onChange={set("organization")} autoComplete="organization" /></label>
                </div>
                <fieldset className="stack" style={{ gap: 6, border: 0, padding: 0, margin: 0 }}>
                  <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Which best describes you?</legend>
                  {([["orgs", "A practice, nonprofit, or helping organization"], ["business", "An entrepreneur or community business"], ["other", "Something else"]] as const).map(([v, l]) => (
                    <label key={v} style={{ flexDirection: "row", alignItems: "center", gap: 10, fontWeight: 400 }}>
                      <input type="radio" name="lane" checked={f.lane === v} onChange={() => setF({ ...f, lane: v })} /> {l}
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            <label>
              {mode === "consult" ? "What would you like to talk about?" : "What would you like to focus on?"} <span className="hint">optional</span>
              <textarea style={{ minHeight: 90 }} value={f.topic} onChange={set("topic")} />
            </label>
            {err && <p className="error-text">{err}</p>}
            <button className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>{busy ? "Booking..." : "Confirm booking"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
