import { notifyAdmin } from "@/lib/notify";
import { currentClient } from "@/lib/auth";
import { getCatalog, rateLimit, saveClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";

// A client asks to add services (no payment). Shows up in your admin as a new request.
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (!(await rateLimit(`req:${client.id}`, 20, 60 * 60))) return error("Too many requests. Try again later.", 429);
  const body = await req.json().catch(() => ({}));
  const catalog = await getCatalog();
  const allowed = new Set(client.addOnIds);
  const ids: string[] = (Array.isArray(body.addOnIds) ? body.addOnIds : [])
    .map(String)
    .filter((id: string) => allowed.has(id) && catalog.services.some((s) => s.id === id));
  const note = String(body.note || "").slice(0, 2000);
  if (!ids.length && !note.trim()) return error("Choose at least one add-on or leave a note.");
  client.requests.push({ id: newId(), addOnIds: ids, note, date: new Date().toISOString(), status: "new" });
  await saveClient(client);
  await notifyAdmin(`${client.name} asked about add-ons`, [ids.length ? `Add-ons: ${ids.map((id) => catalog.services.find((s) => s.id === id)?.name).join(", ")}` : "", note], `/admin/clients/${client.id}`);
  return json({ ok: true });
}
