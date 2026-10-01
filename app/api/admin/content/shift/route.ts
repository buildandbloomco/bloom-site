import { listContent, saveContent } from "@/lib/content";
import { error, json, requireAdmin } from "@/lib/http";

// Move every post that isn't posted yet, from a date onward, by a number of days
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const from = String(b.from || "");
  const days = Math.round(Number(b.days));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return error("Pick a start date.");
  if (!days || Math.abs(days) > 365) return error("Enter how many days to move, like 7 or -3.");
  let moved = 0;
  for (const p of await listContent()) {
    if (!p.date || p.date < from || p.status === "posted") continue;
    const [y, m, d] = p.date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    await saveContent({ ...p, date: dt.toISOString().slice(0, 10) });
    moved++;
  }
  return json({ moved });
}
