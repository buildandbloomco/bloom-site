import "server-only";
import { blankClient, getClient, getSettings, listClients, saveClient, setClientCode, uniqueSlug } from "./data";
import { generateCode, newId } from "./crypto";
import { firstName } from "./format";
import { getCourse, getEnrollment, saveCourse, saveEnrollment } from "./courses";
import type { Course, Enrollment } from "./course-types";
import type { Quote } from "./course-logic";
import type { Client } from "./types";

/** Find the client portal for this email, or create one (with a new access code) */
export async function findOrCreateClient(name: string, email: string): Promise<{ client: Client; created: boolean }> {
  const e = email.trim().toLowerCase();
  const existing = (await listClients()).find((c) => c.email.trim().toLowerCase() === e && c.status !== "archived");
  if (existing) return { client: existing, created: false };
  const client = blankClient(name, await getSettings());
  client.slug = await uniqueSlug(name);
  client.contactName = firstName(name);
  client.email = email.trim();
  client.status = "active";
  client.showBooking = true;
  await saveClient(client);
  for (let i = 0; i < 5; i++) {
    try {
      await setClientCode(client, generateCode());
      break;
    } catch {
      /* retry */
    }
  }
  return { client: (await getClient(client.id)) ?? client, created: true };
}

export function newEnrollment(course: Course, q: Quote, opts: {
  name: string;
  email: string;
  clientId: string;
  addOnIds: string[];
  planId: string;
  couponCode: string;
  comped?: boolean;
}): Enrollment {
  return {
    id: newId(),
    courseId: course.id,
    clientId: opts.clientId,
    packageId: q.pkg!.id,
    addOnIds: opts.addOnIds,
    learnerName: opts.name,
    email: opts.email,
    status: "pending",
    createdAt: new Date().toISOString(),
    activatedAt: null,
    completedAt: null,
    completed: {},
    lastLessonId: "",
    answers: {},
    sessionsIncluded: q.sessions,
    sessionsUsed: 0,
    requests: [],
    total: q.total,
    couponCode: opts.couponCode,
    monthly: q.monthly,
    planId: opts.planId,
    installments: q.installments,
    installmentAmount: q.installmentAmount,
    intervalDays: q.intervalDays || 30,
    payments: [],
    comped: !!opts.comped,
    notes: "",
    showCode: false,
  };
}

/** Mark an enrollment active (first payment made, comped, or added by you) */
export async function activate(e: Enrollment) {
  if (e.status === "pending") {
    e.status = "active";
    e.activatedAt = new Date().toISOString();
    if (e.couponCode) {
      const course = await getCourse(e.courseId);
      const cp = course?.coupons.find((x) => x.code.toUpperCase() === e.couponCode.toUpperCase());
      if (course && cp) {
        cp.uses = (cp.uses || 0) + 1;
        await saveCourse(course);
      }
    }
  }
}

/** Record a Stripe payment against an enrollment (safe to call twice) */
export async function recordEnrollmentPayment(enrollmentId: string, amount: number, stripeRef: string, note: string) {
  const e = await getEnrollment(enrollmentId);
  if (!e) return null;
  if (!e.clientId) {
    const r = await findOrCreateClient(e.learnerName, e.email);
    e.clientId = r.client.id;
    e.showCode = r.created;
  }
  if (!e.payments.some((p) => p.stripeSessionId === stripeRef)) {
    e.payments.push({ id: newId(), amount, date: new Date().toISOString().slice(0, 10), method: "Stripe", note, stripeSessionId: stripeRef });
  }
  await activate(e);
  await saveEnrollment(e);
  return e;
}
