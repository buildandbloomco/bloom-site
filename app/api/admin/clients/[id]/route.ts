import { deleteClient, getClient, saveClient, uniqueSlug, slugify } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { newId } from "@/lib/crypto";
import type { Client, ClientStatus, Deliverable, DeliverableType, Milestone, ProjectUpdate } from "@/lib/types";

const TYPES: DeliverableType[] = ["document", "folder", "website", "video", "content", "presentation", "design", "recording", "other"];

const STATUSES: ClientStatus[] = ["draft", "sent", "active", "completed", "archived"];
const str = (v: unknown, max = 5000) => String(v ?? "").slice(0, max);
const num = (v: unknown) => Math.max(0, Math.round((Number(v) || 0) * 100) / 100);
const strList = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x, 500)).filter((x) => x.trim()) : []);

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");

  const next: Client = {
    ...c,
    name: str(b.name, 120) || c.name,
    contactName: str(b.contactName, 120),
    email: str(b.email, 200),
    status: STATUSES.includes(b.status) ? b.status : c.status,
    tier: b.tier === "business" || b.tier === "org" ? b.tier : "",
    billing: b.billing === "none" ? "none" : "standard",
    welcome: str(b.welcome),
    package: {
      title: str(b.package?.title, 200),
      summary: str(b.package?.summary),
      format: str(b.package?.format, 120),
      duration: str(b.package?.duration, 120),
      startDate: str(b.package?.startDate, 20),
      serviceIds: strList(b.package?.serviceIds),
      customItems: (Array.isArray(b.package?.customItems) ? b.package.customItems : [])
        .map((i: { title?: string; detail?: string }) => ({ title: str(i.title, 200), detail: str(i.detail, 1000) }))
        .filter((i: { title: string }) => i.title.trim()),
    },
    investment: {
      total: num(b.investment?.total),
      retainer: num(b.investment?.retainer),
      lineItems: (Array.isArray(b.investment?.lineItems) ? b.investment.lineItems : [])
        .map((l: { label?: string; amount?: number }) => ({ label: str(l.label, 200), amount: num(l.amount) }))
        .filter((l: { label: string }) => l.label.trim()),
      note: str(b.investment?.note, 1000),
    },
    addOnIds: strList(b.addOnIds),
    libraryIds: strList(b.libraryIds),
    deliverables: (Array.isArray(b.deliverables) ? b.deliverables : [])
      .map((d: Partial<Deliverable>) => ({
        id: str(d.id, 40) || newId(),
        title: str(d.title, 200),
        type: TYPES.includes(d.type as DeliverableType) ? (d.type as DeliverableType) : "other",
        url: /^https?:\/\//i.test(str(d.url)) ? str(d.url, 2000) : "",
        note: str(d.note, 1000),
        status: (["in-progress", "review", "final"] as const).includes(d.status as never) ? (d.status as Deliverable["status"]) : "final",
        date: /^\d{4}-\d{2}-\d{2}$/.test(str(d.date)) ? str(d.date) : new Date().toISOString().slice(0, 10),
        dueDate: /^\d{4}-\d{2}-\d{2}$/.test(str(d.dueDate)) ? str(d.dueDate) : "",
        group: str(d.group, 120),
      }))
      .filter((d: Deliverable) => d.title.trim()),
    updates: (Array.isArray(b.updates) ? b.updates : [])
      .map((u: Partial<ProjectUpdate>) => ({
        id: str(u.id, 40) || newId(),
        date: /^\d{4}-\d{2}-\d{2}$/.test(str(u.date)) ? str(u.date) : new Date().toISOString().slice(0, 10),
        text: str(u.text, 3000),
      }))
      .filter((u: ProjectUpdate) => u.text.trim()),
    milestones: (Array.isArray(b.milestones) ? b.milestones : [])
      .map((m: Partial<Milestone>) => ({
        id: str(m.id, 40) || newId(),
        title: str(m.title, 200),
        due: /^\d{4}-\d{2}-\d{2}$/.test(str(m.due)) ? str(m.due) : "",
        done: !!m.done,
      }))
      .filter((m: Milestone) => m.title.trim()),
    progressOverride:
      b.progressOverride === null || b.progressOverride === "" || b.progressOverride === undefined
        ? null
        : Math.min(100, Math.max(0, Math.round(Number(b.progressOverride) || 0))),
    driveFolderUrl: /^https:\/\/drive\.google\.com\//i.test(str(b.driveFolderUrl)) ? str(b.driveFolderUrl, 1000) : "",
    nextSteps: strList(b.nextSteps),
    showBooking: !!b.showBooking,
    notes: str(b.notes, 20000),
  };
  const wantSlug = slugify(str(b.slug, 60) || next.name);
  if (wantSlug !== c.slug) next.slug = await uniqueSlug(wantSlug, c.id);

  // Payments and requests may have changed since the editor loaded (Stripe), so keep the stored ones.
  const fresh = await getClient(id);
  next.payments = fresh?.payments ?? c.payments;
  next.requests = fresh?.requests ?? c.requests;
  next.consults = fresh?.consults ?? c.consults;
  delete next.links;
  await saveClient(next);
  return json({ ok: true, slug: next.slug });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  await deleteClient(c);
  return json({ ok: true });
}
