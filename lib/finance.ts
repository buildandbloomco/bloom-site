import "server-only";
import { kv } from "./kv";
import { newId } from "./crypto";
import { blankFin, CHECKLIST, r2, type FinSettings, type Owed, type Tx } from "./finance-def";

const sKey = (id: string) => `bb:fin:${id}`;
const tKey = (id: string) => `bb:fin:tx:${id}`;
export async function getFin(clientId: string): Promise<FinSettings> {
  const s = await kv().get<FinSettings>(sKey(clientId));
  return { ...blankFin(), ...(s ?? {}) };
}
export async function saveFin(clientId: string, s: FinSettings) { s.updatedAt = new Date().toISOString(); await kv().set(sKey(clientId), s); }
export async function listTx(clientId: string): Promise<Tx[]> {
  return Object.values(await kv().hgetall<Tx>(tKey(clientId))).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}
export async function putTx(clientId: string, t: Tx) { await kv().hset(tKey(clientId), t.id, t); }
export async function delTx(clientId: string, id: string) { await kv().hdel(tKey(clientId), id); }

const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const amt = (v: unknown) => Math.max(0, Math.min(100000000, r2(Math.abs(Number(v) || 0))));
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
const isUrl = (v: unknown) => /^https:\/\/[^\s]+$/i.test(String(v ?? ""));

/** Clean a transaction coming from the browser */
export function cleanTx(b: Record<string, unknown>, s: FinSettings, prev?: Tx): Tx | null {
  const type = b.type === "in" || b.type === "out" ? b.type : prev?.type;
  const amount = b.amount !== undefined ? amt(b.amount) : prev?.amount ?? 0;
  const date = b.date !== undefined ? (isDate(b.date) ? String(b.date) : "") : prev?.date ?? "";
  if (!type || !amount || !date) return null;
  const ids = new Set(s.buckets.map((x) => x.id));
  const allocIn = b.alloc !== undefined && typeof b.alloc === "object" && b.alloc ? (b.alloc as Record<string, unknown>) : prev?.alloc ?? {};
  const alloc: Record<string, number> = {};
  if (type === "in") {
    let left = amount;
    for (const [k, v] of Object.entries(allocIn)) { if (!ids.has(k)) continue; const n = Math.min(amt(v), left); if (n > 0) { alloc[k] = n; left = r2(left - n); } }
  }
  const cats = type === "in" ? s.incomeCategories : s.expenseCategories;
  const category = b.category !== undefined ? (cats.includes(String(b.category)) ? String(b.category) : "") : prev?.category ?? "";
  const bucket = type === "out" ? (b.bucket !== undefined ? (ids.has(String(b.bucket)) ? String(b.bucket) : "") : prev?.bucket ?? "") : "";
  return {
    id: prev?.id ?? newId(), date, type, amount, alloc, category, bucket,
    desc: b.desc !== undefined ? str(b.desc, 200).trim() : prev?.desc ?? "",
    note: b.note !== undefined ? str(b.note, 500) : prev?.note ?? "",
    receiptUrl: b.receiptUrl !== undefined ? (isUrl(b.receiptUrl) ? str(b.receiptUrl, 600) : "") : prev?.receiptUrl ?? "",
    source: prev?.source ?? (b.source === "import" ? "import" : b.source === "owed" ? "owed" : "manual"),
    createdAt: prev?.createdAt ?? new Date().toISOString(),
  };
}

/** Clean the settings a client can change (buckets, categories, budget, owed, checklist, tax payments) */
export function cleanSettings(b: Record<string, unknown>, cur: FinSettings): FinSettings {
  const s = { ...cur };
  if (Array.isArray(b.buckets)) {
    const seen = new Set<string>();
    s.buckets = (b.buckets as Record<string, unknown>[]).slice(0, 10).map((x) => ({
      id: /^[a-z0-9-]{2,30}$/i.test(String(x.id)) ? String(x.id) : newId().slice(0, 10),
      name: str(x.name, 60).trim() || "Bucket", pct: Math.max(0, Math.min(100, Math.round(Number(x.pct) || 0))), hint: str(x.hint, 120),
    })).filter((x) => !seen.has(x.id) && seen.add(x.id));
    if (!s.buckets.length) s.buckets = cur.buckets;
  }
  const cats = (v: unknown, fb: string[]) => (Array.isArray(v) ? [...new Set((v as unknown[]).map((c) => str(c, 60).trim()).filter(Boolean))].slice(0, 60) : fb);
  s.incomeCategories = cats(b.incomeCategories, cur.incomeCategories);
  s.expenseCategories = cats(b.expenseCategories, cur.expenseCategories);
  if (b.budget && typeof b.budget === "object") {
    s.budget = {};
    for (const [k, v] of Object.entries(b.budget as Record<string, unknown>)) if (s.incomeCategories.includes(k) || s.expenseCategories.includes(k)) { const n = amt(v); if (n) s.budget[k] = n; }
  }
  if (b.opening && typeof b.opening === "object") {
    s.opening = {};
    for (const [k, v] of Object.entries(b.opening as Record<string, unknown>)) if (s.buckets.some((x) => x.id === k)) { const n = r2(Number(v) || 0); if (n) s.opening[k] = n; }
  }
  if (Array.isArray(b.owed)) {
    s.owed = (b.owed as Record<string, unknown>[]).slice(0, 300).map((o): Owed => ({
      id: /^[a-z0-9]{6,40}$/i.test(String(o.id)) ? String(o.id) : newId(), kind: o.kind === "payable" ? "payable" : "receivable",
      name: str(o.name, 120).trim() || "Untitled", amount: amt(o.amount), due: isDate(o.due) ? String(o.due) : "",
      status: o.status === "paid" ? "paid" : "open", note: str(o.note, 300), paidTxId: str(o.paidTxId, 40),
    }));
  }
  if (b.checklist && typeof b.checklist === "object") {
    const ids = new Set(CHECKLIST.map((c) => c.id));
    s.checklist = {};
    for (const [m, items] of Object.entries(b.checklist as Record<string, Record<string, unknown>>)) {
      if (!/^\d{4}-\d{2}$/.test(m) || !items || typeof items !== "object") continue;
      s.checklist[m] = {};
      for (const [k, v] of Object.entries(items)) if (ids.has(k) && v === true) s.checklist[m][k] = true;
    }
  }
  if (Array.isArray(b.taxPayments)) {
    s.taxPayments = (b.taxPayments as Record<string, unknown>[]).filter((p) => /^\d{4}-Q[1-4]$/.test(String(p.quarter))).slice(0, 40)
      .map((p) => ({ quarter: String(p.quarter), amount: amt(p.amount), paidOn: isDate(p.paidOn) ? String(p.paidOn) : "" }));
  }
  return s;
}
