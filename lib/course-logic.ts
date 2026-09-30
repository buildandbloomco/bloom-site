// Shared by admin, learner pages, and checkout. No server-only imports here.
import type { Course, CoursePackage, Enrollment, Lesson } from "./course-types";

const r2 = (n: number) => Math.round(n * 100) / 100;

export function allLessons(c: Course): { lesson: Lesson; moduleIndex: number; moduleTitle: string }[] {
  return c.modules.flatMap((m, i) => m.lessons.map((lesson) => ({ lesson, moduleIndex: i, moduleTitle: m.title })));
}

export function courseProgress(c: Course, e: Pick<Enrollment, "completed" | "lastLessonId">) {
  const lessons = allLessons(c);
  const done = lessons.filter((l) => e.completed[l.lesson.id]).length;
  const total = lessons.length;
  const next = lessons.find((l) => !e.completed[l.lesson.id]) ?? null;
  const modules = c.modules.map((m) => {
    const d = m.lessons.filter((l) => e.completed[l.id]).length;
    return { id: m.id, title: m.title, done: d, total: m.lessons.length, percent: m.lessons.length ? Math.round((d / m.lessons.length) * 100) : 0 };
  });
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, next: next?.lesson ?? null, modules };
}

export interface Quote {
  pkg: CoursePackage | null;
  lines: { label: string; amount: number }[];
  subtotal: number;
  discount: number;
  total: number;
  monthly: boolean;
  installments: number;
  intervalDays: number;
  firstPayment: number;
  installmentAmount: number;
  sessions: number;
  error?: string;
}

export function quote(
  c: Course,
  opts: { packageId: string; planId?: string; addOnIds?: string[]; couponCode?: string }
): Quote {
  const pkg = c.packages.find((p) => p.id === opts.packageId && p.active) ?? null;
  const empty: Quote = { pkg, lines: [], subtotal: 0, discount: 0, total: 0, monthly: false, installments: 1, intervalDays: 0, firstPayment: 0, installmentAmount: 0, sessions: 0 };
  if (!pkg) return { ...empty, error: "Choose a package." };
  const addOns = pkg.monthly ? [] : c.addOns.filter((a) => (opts.addOnIds ?? []).includes(a.id));
  const lines = [{ label: pkg.monthly ? `${pkg.name} (monthly)` : pkg.name, amount: pkg.price }, ...addOns.map((a) => ({ label: a.name, amount: a.price }))];
  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0));
  let discount = 0;
  const code = (opts.couponCode ?? "").trim().toUpperCase();
  let error: string | undefined;
  if (code) {
    const cp = c.coupons.find((x) => x.code.toUpperCase() === code && x.active && (!x.maxUses || x.uses < x.maxUses));
    if (!cp) error = "That code isn't valid.";
    else discount = r2(Math.min(subtotal, (subtotal * (cp.percentOff || 0)) / 100 + (cp.amountOff || 0)));
  }
  const total = r2(subtotal - discount);
  const plan = !pkg.monthly && opts.planId ? c.plans.find((p) => p.id === opts.planId && pkg.planIds.includes(p.id)) : null;
  const installments = plan ? Math.max(1, plan.installments) : 1;
  const installmentAmount = r2(total / installments);
  return {
    pkg,
    lines,
    subtotal,
    discount,
    total,
    monthly: pkg.monthly,
    installments,
    intervalDays: plan?.intervalDays ?? 0,
    firstPayment: installmentAmount,
    installmentAmount,
    sessions: pkg.sessions + addOns.reduce((s, a) => s + (a.sessions || 0), 0),
    error,
  };
}

export function paidSoFar(e: Enrollment): number {
  return r2(e.payments.reduce((s, p) => s + p.amount, 0));
}

/** What is still owed for one-time packages (0 for monthly and comped) */
export function balance(e: Enrollment): number {
  if (e.monthly || e.comped) return 0;
  return Math.max(0, r2(e.total - paidSoFar(e)));
}

export function nextPayment(e: Enrollment): { amount: number; due: string } | null {
  const owe = balance(e);
  if (owe <= 0) return null;
  const start = new Date(e.activatedAt || e.createdAt);
  const made = e.payments.length;
  const due = new Date(start.getTime() + made * (e.intervalDays || 30) * 86400000);
  return { amount: Math.min(owe, e.installmentAmount || owe), due: due.toISOString().slice(0, 10) };
}

export const FORMAT_LABEL: Record<string, string> = {
  "self-paced": "Self-paced",
  virtual: "Virtual",
  "in-person": "In person",
  hybrid: "Hybrid",
};
