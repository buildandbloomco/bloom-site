import { isAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { listResponses } from "@/lib/workspace";
import { DOMAINS, itemKey, OPEN_QUESTIONS } from "@/lib/assessment-def";

type Ctx = { params: Promise<{ id: string }> };
const q = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Anonymous team responses as a spreadsheet
export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return new Response("Please sign in again.", { status: 401 });
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return new Response("Not found", { status: 404 });
  const rows = await listResponses(id);
  const cols = DOMAINS.flatMap((d) => d.items.map((it, i) => ({ k: itemKey(d.id, i), label: `${d.name}: ${it}` })));
  const head = ["Submitted", "Role", ...cols.map((c) => c.label), ...OPEN_QUESTIONS].map(q).join(",");
  const lines = rows.map((r) => [r.at.slice(0, 10), r.role, ...cols.map((c) => String(r.answers[c.k] ?? "")), ...OPEN_QUESTIONS.map((_, i) => r.open[i] ?? "")].map(q).join(","));
  return new Response([head, ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${c.slug}-wellness-assessment.csv"` },
  });
}
