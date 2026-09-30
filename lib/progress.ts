import type { Client, Deliverable, Milestone } from "./types";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(due: string, done: boolean): boolean {
  return !!due && !done && due < today();
}

export function daysSince(date: string): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date + "T12:00:00").getTime()) / 86400000);
}

export interface Progress {
  percent: number;
  label: string;
  next: { title: string; due: string; overdue: boolean } | null;
}

/** Progress from milestones (or finished deliverables if there are no milestones), unless set by hand */
export function computeProgress(c: Pick<Client, "milestones" | "deliverables" | "progressOverride">): Progress | null {
  const ms: Milestone[] = c.milestones ?? [];
  const ds: Deliverable[] = c.deliverables ?? [];
  let percent: number | null = null;
  let label = "";
  if (ms.length) {
    const done = ms.filter((m) => m.done).length;
    percent = Math.round((done / ms.length) * 100);
    label = `${done} of ${ms.length} milestones complete`;
  } else if (ds.length) {
    const done = ds.filter((d) => d.status === "final").length;
    percent = Math.round((done / ds.length) * 100);
    label = `${done} of ${ds.length} deliverables final`;
  }
  if (typeof c.progressOverride === "number") {
    percent = c.progressOverride;
    label = label || "Project progress";
  }
  if (percent === null) return null;

  const upcoming = [
    ...ms.filter((m) => !m.done && m.due).map((m) => ({ title: m.title, due: m.due })),
    ...ds.filter((d) => d.status !== "final" && d.dueDate).map((d) => ({ title: d.title, due: d.dueDate })),
  ].sort((a, b) => a.due.localeCompare(b.due));
  const n = upcoming[0];
  return { percent, label, next: n ? { ...n, overdue: isOverdue(n.due, false) } : null };
}
