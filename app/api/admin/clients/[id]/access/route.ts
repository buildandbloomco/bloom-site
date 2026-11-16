import { getClient, saveClient } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import { makeFullPortal } from "@/lib/event-client";
import { getFin, saveFin } from "@/lib/finance";
import { listLeads, saveLead } from "@/lib/leads";

// Make an event guest an active client (full portal, private code, lead converted), or switch someone back to a guest pass
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (b.kind === "full") {
    await makeFullPortal(c);
    c.status = "active";
    await saveClient(c);
    const lead = (await listLeads()).find((l) => l.clientId === c.id);
    if (lead && lead.status !== "converted") await saveLead({ ...lead, status: "converted" });
    // Their access code stays the same
    return json({ ok: true, code: c.codeEnc ? decryptCode(c.codeEnc) : "" });
  }
  if (b.kind === "guest") {
    c.kind = "guest";
    const fin = await getFin(c.id);
    if (fin.enabled) await saveFin(c.id, { ...fin, enabled: false });
    await saveClient(c);
    return json({ ok: true });
  }
  return error("Bad request.");
}
