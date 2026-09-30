// Minimal iCalendar builder. Times are treated as Eastern Time (America/New_York).
export interface IcsEvent {
  uid: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

const esc = (s = "") => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const d = (date: string, time: string) => `${date.replace(/-/g, "")}T${(time || "09:00").replace(":", "")}00`;

export function buildIcs(name: string, events: IcsEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Build & Bloom Collective//Portal//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${esc(name)}`,
    "X-WR-TIMEZONE:America/New_York",
  ];
  for (const e of events.filter((x) => x.date)) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@buildandbloomcollective`,
      `DTSTAMP:${stamp}`,
      e.start ? `DTSTART;TZID=America/New_York:${d(e.date, e.start)}` : `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      e.start ? `DTEND;TZID=America/New_York:${d(e.date, e.end || e.start)}` : `DTEND;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
