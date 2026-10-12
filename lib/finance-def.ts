/** Money: a simple, high-level bookkeeping and cash plan for a client. Shared by the browser and the server. */

export type TxType = "in" | "out";
export interface Tx {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  type: TxType;
  /** Always positive */
  amount: number;
  desc: string;
  category: string;
  /** For money out: which bucket paid for it */
  bucket: string;
  /** For money in: how much went to each bucket */
  alloc: Record<string, number>;
  receiptUrl: string;
  note: string;
  source: "manual" | "import" | "owed";
  createdAt: string;
}
export interface Bucket { id: string; name: string; pct: number; hint: string }
export interface Owed { id: string; kind: "receivable" | "payable"; name: string; amount: number; due: string; status: "open" | "paid"; note: string; paidTxId: string }
export interface TaxPayment { quarter: string; amount: number; paidOn: string }
export interface FinSettings {
  enabled: boolean;
  buckets: Bucket[];
  incomeCategories: string[];
  expenseCategories: string[];
  /** category -> planned monthly amount */
  budget: Record<string, number>;
  owed: Owed[];
  /** "YYYY-MM" -> checklist item id -> done */
  checklist: Record<string, Record<string, boolean>>;
  taxPayments: TaxPayment[];
  /** Opening balance per bucket, if they already had money set aside */
  opening: Record<string, number>;
  updatedAt: string;
}

export const DEFAULT_BUCKETS: Bucket[] = [
  { id: "profit", name: "Profit", pct: 5, hint: "Pay yourself a reward, and build a cushion" },
  { id: "owner", name: "Owner's pay", pct: 50, hint: "What you take home" },
  { id: "tax", name: "Taxes", pct: 15, hint: "Set aside so tax time is not a surprise" },
  { id: "opex", name: "Operating expenses", pct: 30, hint: "Everything it takes to run the business" },
];
export const DEFAULT_INCOME = ["Client services", "Products", "Workshops and events", "Grants and donations", "Other income"];
export const DEFAULT_EXPENSE = ["Advertising and marketing", "Contractors", "Payroll", "Software and subscriptions", "Office and supplies", "Rent and utilities", "Phone and internet", "Travel", "Meals", "Professional fees", "Bank and payment fees", "Insurance", "Education and training", "Materials and inventory", "Owner draw", "Tax payments", "Other"];
export const CHECKLIST = [
  { id: "record", label: "Every deposit and payment is entered (or imported from your bank)" },
  { id: "categorize", label: "Every transaction has a category" },
  { id: "receipts", label: "Receipts are attached for business expenses" },
  { id: "allocate", label: "All income is split into your buckets" },
  { id: "reconcile", label: "Your totals match your bank statement for the month" },
  { id: "owed", label: "Invoices and bills are up to date" },
  { id: "budget", label: "You looked at budget vs. actual and noted any surprises" },
  { id: "send", label: "Monthly report sent to your bookkeeper or accountant" },
];
export const blankFin = (): FinSettings => ({ enabled: false, buckets: DEFAULT_BUCKETS.map((b) => ({ ...b })), incomeCategories: [...DEFAULT_INCOME], expenseCategories: [...DEFAULT_EXPENSE], budget: {}, owed: [], checklist: {}, taxPayments: [], opening: {}, updatedAt: "" });

export const r2 = (n: number) => Math.round(n * 100) / 100;
export const monthOf = (d: string) => d.slice(0, 7);
export const allocated = (t: Tx) => r2(Object.values(t.alloc || {}).reduce((a, b) => a + (Number(b) || 0), 0));
export const unallocated = (t: Tx) => (t.type === "in" ? Math.max(0, r2(t.amount - allocated(t))) : 0);

/** Money in, out, and net for a set of transactions */
export function totals(list: Tx[]) {
  let inn = 0, out = 0;
  for (const t of list) t.type === "in" ? (inn += t.amount) : (out += t.amount);
  return { inn: r2(inn), out: r2(out), net: r2(inn - out) };
}
/** What is in each bucket: opening + everything allocated in - everything paid out of it */
export function bucketBalances(s: FinSettings, tx: Tx[], upTo = "9999-99-99") {
  const bal: Record<string, { allocated: number; spent: number; balance: number }> = {};
  for (const b of s.buckets) bal[b.id] = { allocated: 0, spent: 0, balance: Number(s.opening[b.id]) || 0 };
  for (const t of tx) {
    if (t.date > upTo) continue;
    if (t.type === "in") for (const [k, v] of Object.entries(t.alloc || {})) if (bal[k]) { bal[k].allocated += v; bal[k].balance += v; }
    if (t.type === "out" && t.bucket && bal[t.bucket]) { bal[t.bucket].spent += t.amount; bal[t.bucket].balance -= t.amount; }
  }
  for (const k of Object.keys(bal)) { bal[k].allocated = r2(bal[k].allocated); bal[k].spent = r2(bal[k].spent); bal[k].balance = r2(bal[k].balance); }
  return bal;
}
/** Split an amount across buckets by their percentages; the last bucket takes the rounding */
export function splitByPct(amount: number, buckets: Bucket[]) {
  const total = buckets.reduce((a, b) => a + (b.pct || 0), 0) || 100;
  const out: Record<string, number> = {};
  let used = 0;
  buckets.forEach((b, i) => {
    const v = i === buckets.length - 1 ? r2(amount - used) : r2((amount * (b.pct || 0)) / total);
    if (v > 0) out[b.id] = v;
    used = r2(used + v);
  });
  return out;
}
/** Federal estimated tax due dates (Form 1040-ES) for a tax year. A date on a weekend moves to Monday; check the IRS for holidays. */
export function estimatedTaxDates(year: number) {
  const roll = (y: number, m: number, d: number) => {
    const dt = new Date(Date.UTC(y, m - 1, d));
    while (dt.getUTCDay() === 0 || dt.getUTCDay() === 6) dt.setUTCDate(dt.getUTCDate() + 1);
    return dt.toISOString().slice(0, 10);
  };
  return [
    { quarter: `${year}-Q1`, label: `Q1 ${year}`, due: roll(year, 4, 15), covers: "January to March" },
    { quarter: `${year}-Q2`, label: `Q2 ${year}`, due: roll(year, 6, 15), covers: "April and May" },
    { quarter: `${year}-Q3`, label: `Q3 ${year}`, due: roll(year, 9, 15), covers: "June to August" },
    { quarter: `${year}-Q4`, label: `Q4 ${year}`, due: roll(year + 1, 1, 15), covers: "September to December" },
  ];
}
export const money0 = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const monthLabel = (m: string) => new Date(m + "-15T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
export function shiftMonth(m: string, by: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 15));
  return d.toISOString().slice(0, 7);
}

/** Read a bank CSV export: finds the date, description, and amount (or debit and credit) columns on its own */
export function parseBankCsv(text: string): { rows: { date: string; desc: string; amount: number; type: TxType }[]; error?: string } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], error: "That file looks empty." };
  const split = (l: string) => {
    const out: string[] = []; let cur = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === "," && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.includes(k)));
  const di = find("date", "posted");
  const ds = find("description", "memo", "payee", "name", "details", "merchant");
  const ai = head.findIndex((h) => h === "amount" || h.includes("amount"));
  const dbi = find("debit", "withdrawal", "money out");
  const cri = find("credit", "deposit", "money in");
  if (di < 0 || (ai < 0 && dbi < 0 && cri < 0)) return { rows: [], error: "We couldn't find a Date column and an Amount (or Debit and Credit) column. Download the CSV from your bank and try again." };
  const num = (s: string) => { if (!s) return 0; const neg = /^\(.*\)$/.test(s) || s.includes("-"); const n = Number(s.replace(/[^0-9.]/g, "")) || 0; return neg ? -n : n; };
  const toDate = (s: string) => {
    s = s.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`; }
    return "";
  };
  const rows: { date: string; desc: string; amount: number; type: TxType }[] = [];
  for (const l of lines.slice(1)) {
    const c = split(l);
    const date = toDate(c[di] || "");
    if (!date) continue;
    let amt = 0;
    if (ai >= 0 && c[ai]) amt = num(c[ai]);
    else amt = num(c[cri] || "") - Math.abs(num(c[dbi] || ""));
    if (!amt) continue;
    rows.push({ date, desc: (ds >= 0 ? c[ds] : "").slice(0, 200) || "Bank transaction", amount: Math.abs(r2(amt)), type: amt > 0 ? "in" : "out" });
  }
  if (!rows.length) return { rows, error: "No transactions were found in that file." };
  return { rows };
}
