import { requireAdmin } from "@/lib/http";
import { ledger, SOURCE_LABEL } from "@/lib/ledger";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Keep spreadsheet apps from treating a value as a formula
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Every recorded payment as a spreadsheet. Add ?from=YYYY-MM-DD to start at a date.
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const from = new URL(req.url).searchParams.get("from") || "";
  const rows = (await ledger()).filter((r) => r.status === "paid" && (!from || r.date.slice(0, 10) >= from));
  const lines = [
    ["Date", "Name", "Email", "For", "Type", "Method", "Amount"].join(","),
    ...rows.map((r) => [r.date.slice(0, 10), r.who, r.email, r.what, SOURCE_LABEL[r.source], r.method, r.amount.toFixed(2)].map(cell).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="payments${from ? `-since-${from}` : ""}.csv"` },
  });
}
