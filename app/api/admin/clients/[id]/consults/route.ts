import { getClient, saveClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { blankConsult } from "@/lib/consult";
import { error, json, requireAdmin } from "@/lib/http";

// Start a new consultation sheet for this client
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const sheet = blankConsult(newId(), c.name);
  sheet.attendees = c.contactName ? `${c.contactName}, Jadon` : "";
  c.consults.unshift(sheet);
  await saveClient(c);
  return json({ id: sheet.id });
}
