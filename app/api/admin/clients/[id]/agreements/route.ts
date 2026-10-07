import { getClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { draftAgreement, listAgreements, saveAgreements } from "@/lib/agreements";

// Create, edit, send, and remove agreements for one client. A signed agreement can never be edited.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  let list = await listAgreements(id);
  const a = list.find((x) => x.id === String(b.id));
  const now = new Date().toISOString();
  switch (b.action) {
    case "create": {
      list = [await draftAgreement(client), ...list].slice(0, 30);
      break;
    }
    case "save": {
      if (!a) return error("Not found.", 404);
      if (a.status === "signed") return error("This agreement is signed and locked. Create a new one to change the terms.");
      const title = String(b.title ?? "").trim().slice(0, 160);
      const body = String(b.body ?? "").slice(0, 40000);
      if (!title || !body.trim()) return error("Add a title and the agreement text.");
      a.title = title; a.body = body; a.requiredToPay = !!b.requiredToPay;
      if (b.send === true) { a.status = "sent"; a.sentAt = now; }
      if (b.send === false) { a.status = "draft"; a.sentAt = null; }
      break;
    }
    case "delete": {
      if (!a) return error("Not found.", 404);
      if (a.status === "signed" && b.confirm !== "DELETE") return error("Signed agreements are kept as a record. Type DELETE to remove it anyway.");
      list = list.filter((x) => x.id !== a.id);
      break;
    }
    default: return error("Bad request.");
  }
  await saveAgreements(id, list);
  return json({ list });
}
