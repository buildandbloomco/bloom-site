// Booking availability. Pure functions, safe on client and server.
// Every time here is a wall-clock time in Eastern Time (America/New_York).
import type { BookingSettings, Settings } from "./types";

export const TZ = "America/New_York";
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Busy {
  date: string;
  start: string;
  end: string;
  /** Whole day unavailable */
  allDay?: boolean;
}

export interface DaySlots {
  date: string;
  times: string[];
}

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};
export const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** "14:30" -> "2:30 PM" */
export function fmtTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "2026-10-06" -> "Tuesday, October 6" */
export function longDate(d: string): string {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

export function weekday(d: string): number {
  return new Date(d + "T12:00:00Z").getUTCDay();
}

export function addDays(d: string, n: number): string {
  const x = new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/** Current date and minute-of-day in Eastern Time */
export function nowET(at = new Date()): { date: string; min: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(at)
      .map((x) => [x.type, x.value])
  );
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

/** Open start times for the next `daysAhead` days */
export function openSlots(b: BookingSettings, minutes: number, busy: Busy[], at = new Date()): DaySlots[] {
  const now = nowET(at);
  const earliest = now.min + Math.max(0, b.noticeHours) * 60; // minutes from today's midnight
  const step = Math.min(30, minutes);
  const buf = Math.max(0, b.bufferMinutes);
  const blocked = new Set(b.blockedDates);
  const out: DaySlots[] = [];
  for (let i = 0; i <= Math.max(1, b.daysAhead); i++) {
    const date = addDays(now.date, i);
    if (blocked.has(date)) continue;
    const dayBusy = busy.filter((x) => x.date === date);
    if (dayBusy.some((x) => x.allDay)) continue;
    const timed = dayBusy.filter((x) => x.start);
    if (b.maxPerDay > 0 && timed.length >= b.maxPerDay) continue;
    const times: string[] = [];
    const blocks = b.hours.filter((h) => h.day === weekday(date) && h.start && h.end).sort((x, y) => x.start.localeCompare(y.start));
    for (const h of blocks) {
      for (let s = toMin(h.start); s + minutes <= toMin(h.end); s += step) {
        if (i * 1440 + s < earliest) continue;
        const e = s + minutes;
        const clash = timed.some((x) => {
          const bs = toMin(x.start) - buf;
          const be = toMin(x.end || x.start) + buf;
          return s < be && e > bs;
        });
        if (!clash) times.push(toTime(s));
      }
    }
    const uniq = [...new Set(times)].sort();
    if (uniq.length) out.push({ date, times: uniq });
  }
  return out;
}

/** Where every Book button should go */
export function bookHref(s: Pick<Settings, "booking" | "bookingUrl">, query = ""): string {
  if (s.booking?.enabled || !s.bookingUrl) return `/book${query}`;
  return s.bookingUrl;
}
export const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Props for a Book link: opens in a new tab only when it goes to another site */
export function bookProps(s: Pick<Settings, "booking" | "bookingUrl">, query = ""): { href: string; target?: string; rel?: string } {
  const href = bookHref(s, query);
  return isExternal(href) ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
}
