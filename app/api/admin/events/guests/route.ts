import { error, requireAdmin } from "@/lib/http";
import { eventSummaries } from "@/lib/ledger";

const STATUS = { paid: "Paid", comp: "Complimentary", zelle: "Zelle to confirm", unpaid: "Didn't finish paying" };
const cell = (v: unknown) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; // keep spreadsheet apps from running it as a formula
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// One event's guest list as a spreadsheet: everyone with a seat, then people who didn't finish paying
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get("slug") || "";
  const s = (await eventSummaries()).find((x) => x.e.slug === slug);
  if (!s) return error("Event not found.", 404);
  const rows = [...s.guests].sort((a, b) => (a.status === "unpaid") === (b.status === "unpaid") ? a.name.localeCompare(b.name) : a.status === "unpaid" ? 1 : -1);
  const lines = [
    ["Guest", "Email", "Phone", "Offer", "Status", "Paid", "Gift from", "Buyer email", "Gift note", "Signed up"].join(","),
    ...rows.map((g) => [g.name, g.email, g.phone, g.tier, STATUS[g.status], g.paid.toFixed(2), g.buyer?.name ?? "", g.buyer?.email ?? "", g.gift?.note ?? "", g.date.slice(0, 10)].map(cell).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}-guests.csv"` },
  });
}
