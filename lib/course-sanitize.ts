import type { Course, CourseFormat, PromptType } from "./course-types";
import { slugify } from "./data";

const str = (v: unknown, max = 5000) => String(v ?? "").slice(0, max);
const num = (v: unknown, min = 0, max = 1e7) => Math.min(max, Math.max(min, Math.round((Number(v) || 0) * 100) / 100));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const date = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : "");
const time = (v: unknown) => (/^\d{2}:\d{2}$/.test(str(v)) ? str(v) : "");
const rid = () => Math.random().toString(36).slice(2, 10);
const id = (v: unknown) => str(v, 40).replace(/[^a-zA-Z0-9_-]/g, "") || rid();
const FORMATS: CourseFormat[] = ["self-paced", "virtual", "in-person", "hybrid"];
const PTYPES: PromptType[] = ["short", "long", "table", "checklist", "scale"];

/** Clean what the course editor sends. Coupon usage counts always come from the saved copy. */
export function sanitizeCourse(b: Partial<Course>, saved: Course): Course {
  const plans = arr<Course["plans"][number]>(b.plans).slice(0, 12).map((p) => ({
    id: id(p.id),
    label: str(p.label, 80) || `${p.installments} payments`,
    installments: Math.round(num(p.installments, 1, 24)),
    intervalDays: Math.round(num(p.intervalDays, 1, 365)) || 30,
  }));
  const planIds = new Set(plans.map((p) => p.id));
  return {
    ...saved,
    title: str(b.title, 200) || saved.title,
    slug: slugify(str(b.slug, 80) || str(b.title, 80) || saved.slug),
    subtitle: str(b.subtitle, 300),
    description: str(b.description),
    format: FORMATS.includes(b.format as CourseFormat) ? (b.format as CourseFormat) : "self-paced",
    status: b.status === "published" || b.status === "archived" ? b.status : "draft",
    showOnSite: !!b.showOnSite,
    pace: str(b.pace, 300),
    welcome: str(b.welcome, 20000),
    affirmations: arr<string>(b.affirmations).map((x) => str(x, 300)).filter((x) => x.trim()).slice(0, 50),
    closing: str(b.closing, 5000),
    modules: arr<Course["modules"][number]>(b.modules).slice(0, 60).map((m) => ({
      id: id(m.id),
      title: str(m.title, 200),
      summary: str(m.summary, 2000),
      lessons: arr<Course["modules"][number]["lessons"][number]>(m.lessons).slice(0, 80).map((l) => ({
        id: id(l.id),
        title: str(l.title, 200),
        intro: str(l.intro, 30000),
        videoUrl: /^https?:\/\//.test(str(l.videoUrl)) ? str(l.videoUrl, 1000) : "",
        resourceUrl: /^https?:\/\//.test(str(l.resourceUrl)) ? str(l.resourceUrl, 1000) : "",
        resourceLabel: str(l.resourceLabel, 120),
        callout: str(l.callout, 3000),
        minutes: Math.round(num(l.minutes, 0, 600)),
        prompts: arr<Course["modules"][number]["lessons"][number]["prompts"][number]>(l.prompts).slice(0, 60).map((p) => ({
          id: id(p.id),
          type: PTYPES.includes(p.type) ? p.type : "long",
          label: str(p.label, 1000),
          help: str(p.help, 2000),
          columns: arr<string>(p.columns).map((x) => str(x, 120)).slice(0, 10),
          rows: arr<string>(p.rows).map((x) => str(x, 200)).filter((x) => x.trim()).slice(0, 40),
          blankRows: Math.round(num(p.blankRows, 0, 40)),
          options: arr<string>(p.options).map((x) => str(x, 300)).filter((x) => x.trim()).slice(0, 60),
        })),
      })),
    })),
    packages: arr<Course["packages"][number]>(b.packages).slice(0, 12).map((p) => ({
      id: id(p.id),
      name: str(p.name, 120),
      description: str(p.description, 1000),
      includes: arr<string>(p.includes).map((x) => str(x, 200)).filter((x) => x.trim()).slice(0, 20),
      price: num(p.price),
      monthly: !!p.monthly,
      sessions: Math.round(num(p.sessions, 0, 100)),
      sessionMinutes: Math.round(num(p.sessionMinutes, 0, 600)),
      format: str(p.format, 120),
      planIds: arr<string>(p.planIds).filter((x) => planIds.has(x)),
      featured: !!p.featured,
      active: p.active !== false,
    })),
    addOns: arr<Course["addOns"][number]>(b.addOns).slice(0, 20).map((a) => ({
      id: id(a.id),
      name: str(a.name, 120),
      description: str(a.description, 500),
      price: num(a.price),
      sessions: Math.round(num(a.sessions, 0, 20)),
    })),
    plans,
    coupons: arr<Course["coupons"][number]>(b.coupons).slice(0, 50).map((c) => {
      const code = str(c.code, 30).toUpperCase().replace(/[^A-Z0-9-]/g, "");
      const old = saved.coupons.find((x) => x.code === code);
      return {
        code,
        percentOff: num(c.percentOff, 0, 100),
        amountOff: num(c.amountOff),
        active: !!c.active,
        maxUses: Math.round(num(c.maxUses, 0, 100000)),
        uses: old?.uses ?? 0,
      };
    }).filter((c) => c.code),
    resources: arr<Course["resources"][number]>(b.resources).slice(0, 40).map((r) => ({
      title: str(r.title, 200),
      url: /^https?:\/\//.test(str(r.url)) ? str(r.url, 1000) : "",
      note: str(r.note, 300),
    })).filter((r) => r.title && r.url),
    libraryIds: arr<string>(b.libraryIds).map((x) => str(x, 80)),
    liveSessions: arr<Course["liveSessions"][number]>(b.liveSessions).slice(0, 100).map((s) => ({
      id: id(s.id),
      title: str(s.title, 200),
      date: date(s.date),
      start: time(s.start),
      end: time(s.end),
      location: str(s.location, 300),
      link: /^https?:\/\//.test(str(s.link)) ? str(s.link, 1000) : "",
      notes: str(s.notes, 1000),
    })).filter((s) => s.title && s.date),
    printableWorkbook: !!b.printableWorkbook,
    certificate: !!b.certificate,
  };
}
