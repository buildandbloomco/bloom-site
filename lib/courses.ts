import "server-only";
import { kv } from "./kv";
import { newId } from "./crypto";
import { slugify } from "./data";
import type { Appointment, Course, Enrollment } from "./course-types";
import seed from "./seed-course.json";

const K = { courses: "bb:courses", enrollments: "bb:enrollments", appts: "bb:appts", mig: "bb:mig:courses1" };

export function blankCourse(title: string): Course {
  const now = new Date().toISOString();
  return {
    id: newId(),
    slug: slugify(title),
    title,
    subtitle: "",
    description: "",
    format: "self-paced",
    status: "draft",
    showOnSite: true,
    pace: "",
    welcome: "",
    affirmations: [],
    closing: "",
    modules: [],
    packages: [],
    addOns: [],
    plans: [
      { id: "plan-2", label: "2 monthly payments", installments: 2, intervalDays: 30 },
      { id: "plan-3", label: "3 monthly payments", installments: 3, intervalDays: 30 },
    ],
    coupons: [],
    resources: [],
    libraryIds: [],
    liveSessions: [],
    printableWorkbook: true,
    certificate: true,
    createdAt: now,
    updatedAt: now,
  };
}

let seeding: Promise<void> | null = null;
function ensureCourseSeed() {
  if (!seeding) {
    seeding = (async () => {
      if (await kv().get(K.mig)) return;
      const c = blankCourse("Rooted in Many Streams");
      c.slug = "rooted-in-many-streams";
      c.subtitle = "A workbook course for building multiple, sustainable streams of income";
      c.description =
        "A working guide for growing what's already rooted, and planting what's next. Across six parts you will move from who you are to a concrete 90-day plan: your story and mission, a clear snapshot of where you are, new income streams worth building, positioning, the systems that keep growth sustainable, and an action plan with real dates.";
      c.format = "self-paced";
      c.status = "draft";
      c.pace = seed.pace ? seed.pace.charAt(0).toUpperCase() + seed.pace.slice(1) : "";
      c.welcome = seed.welcome;
      c.affirmations = seed.affirmations;
      c.modules = seed.modules as Course["modules"];
      c.packages = [
        {
          id: "rooted",
          name: "Rooted (Self-Guided)",
          description: "The full course and workbook, at your own pace.",
          includes: ["The complete online course", "Printable workbook", "Your answers saved as you go"],
          price: 37,
          monthly: false,
          sessions: 0,
          sessionMinutes: 0,
          format: "Digital, self-paced",
          planIds: [],
          featured: false,
          active: true,
        },
        {
          id: "clarity",
          name: "Guided Clarity Session",
          description: "The course plus one strategy session to turn your answers into a plan.",
          includes: ["Everything in Rooted", "One 90-minute strategy session", "Written recap and action summary"],
          price: 225,
          monthly: false,
          sessions: 1,
          sessionMinutes: 90,
          format: "Self-paced + 1 session",
          planIds: ["plan-2"],
          featured: false,
          active: true,
        },
        {
          id: "intensive",
          name: "Build & Bloom Intensive",
          description: "Guided support from kickoff to your final roadmap.",
          includes: [
            "Everything in Rooted",
            "Intake questionnaire",
            "3 sessions: kickoff, midpoint check-in, final roadmap",
            "Email support between sessions",
            "Personalized action plan",
          ],
          price: 650,
          monthly: false,
          sessions: 3,
          sessionMinutes: 60,
          format: "3 sessions over 3 to 4 weeks",
          planIds: ["plan-2", "plan-3"],
          featured: true,
          active: true,
        },
        {
          id: "partner",
          name: "Ongoing Growth Partner",
          description: "Everything in the Intensive, then ongoing monthly support and accountability.",
          includes: ["Everything in the Intensive", "1 session every month", "Async check-ins", "Accountability"],
          price: 275,
          monthly: true,
          sessions: 1,
          sessionMinutes: 60,
          format: "Monthly retainer",
          planIds: [],
          featured: false,
          active: true,
        },
      ];
      c.addOns = [
        { id: "extra-session", name: "Extra 60-minute session", description: "One more 1:1 session with Jadon.", price: 125, sessions: 1 },
        { id: "async-week", name: "Async support week", description: "A week of email or voice-note support between sessions.", price: 75, sessions: 0 },
        { id: "partner-seat", name: "Partner or spouse seat", description: "Bring a partner, co-founder, or spouse into your sessions.", price: 100, sessions: 0 },
      ];
      await kv().hset(K.courses, c.id, c);
      await kv().set(K.mig, true);
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

export async function listCourses(): Promise<Course[]> {
  await ensureCourseSeed();
  const all = await kv().hgetall<Course>(K.courses);
  return Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getCourse(id: string): Promise<Course | null> {
  await ensureCourseSeed();
  return kv().hget<Course>(K.courses, id);
}
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return (await listCourses()).find((c) => c.slug === slug) ?? null;
}
export async function saveCourse(c: Course) {
  c.updatedAt = new Date().toISOString();
  await kv().hset(K.courses, c.id, c);
}
export async function deleteCourse(id: string) {
  await kv().hdel(K.courses, id);
}

export async function listEnrollments(filter?: { courseId?: string; clientId?: string }): Promise<Enrollment[]> {
  const all = Object.values(await kv().hgetall<Enrollment>(K.enrollments));
  return all
    .filter((e) => (!filter?.courseId || e.courseId === filter.courseId) && (!filter?.clientId || e.clientId === filter.clientId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getEnrollment(id: string): Promise<Enrollment | null> {
  return kv().hget<Enrollment>(K.enrollments, id);
}
export async function saveEnrollment(e: Enrollment) {
  await kv().hset(K.enrollments, e.id, e);
}
export async function deleteEnrollment(id: string) {
  await kv().hdel(K.enrollments, id);
}

export async function listAppointments(): Promise<Appointment[]> {
  const all = Object.values(await kv().hgetall<Appointment>(K.appts));
  return all.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}
export async function getAppointment(id: string) {
  return kv().hget<Appointment>(K.appts, id);
}
export async function saveAppointment(a: Appointment) {
  await kv().hset(K.appts, a.id, a);
}
export async function deleteAppointment(id: string) {
  await kv().hdel(K.appts, id);
}

export async function uniqueCourseSlug(base: string, selfId?: string) {
  const taken = new Set((await listCourses()).filter((c) => c.id !== selfId).map((c) => c.slug));
  let s = slugify(base);
  let n = 2;
  while (taken.has(s)) s = `${slugify(base)}-${n++}`;
  return s;
}
