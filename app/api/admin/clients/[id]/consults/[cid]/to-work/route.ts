import { getClient, saveClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

// Copy confirmed deliverables from the sheet into the client's "Your Work" section
export async function POST(_req: Request, ctx: { params: Promise<{ id: string; cid: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id, cid } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const sheet = c.consults.find((x) => x.id === cid);
  if (!sheet) return error("Sheet not found.", 404);
  const today = new Date().toISOString().slice(0, 10);
  let added = 0;
  for (const d of sheet.deliverables) {
    if (!d.confirmed || d.addedToWork || !d.title.trim()) continue;
    c.deliverables.push({
      id: newId(),
      title: d.title,
      type: "other",
      url: "",
      note: "",
      status: "in-progress",
      date: today,
      dueDate: d.due,
      group: "",
    });
    d.addedToWork = true;
    added++;
  }
  await saveClient(c);
  return json({ added, deliverables: sheet.deliverables });
}
