import { syncAgreement } from "@/lib/agreements";
import { getCatalog, getClient, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { buildQuote } from "@/lib/tier";

// Copy the starting price from a consultation sheet into the client's package and investment
export async function POST(_req: Request, ctx: { params: Promise<{ id: string; cid: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id, cid } = await ctx.params;
  const [c, catalog] = await Promise.all([getClient(id), getCatalog()]);
  if (!c) return error("Client not found.", 404);
  const sheet = c.consults.find((x) => x.id === cid);
  if (!sheet) return error("Sheet not found.", 404);
  const q = buildQuote(sheet, catalog.services);
  if (!q.lines.length) return error("Choose at least one service first.");
  if (q.unpriced) return error("Add a price for every service marked custom quote first.");
  c.package.serviceIds = q.lines.map((l) => l.id);
  c.investment.lineItems = [
    ...q.lines.map((l) => ({ label: l.qty > 1 ? `${l.name} (${l.qty} x $${l.price})` : l.name, amount: l.total })),
    ...(q.discount > 0 ? [{ label: sheet.quote.discountNote || "Adjustment", amount: -q.discount }] : []),
  ];
  c.investment.total = q.total;
  if (c.investment.retainer > q.total) c.investment.retainer = 0;
  if (sheet.quote.note) c.investment.note = sheet.quote.note.slice(0, 300);
  if (sheet.tier) c.tier = sheet.tier;
  sheet.quote.appliedAt = new Date().toISOString();
  await saveClient(c);
  await syncAgreement(c);
  return json({ ok: true, total: q.total, appliedAt: sheet.quote.appliedAt });
}
