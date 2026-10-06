import { getCatalog, getClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { blankProposal, cleanOptions, getProposal, optionFromClient, saveProposal } from "@/lib/proposals";

const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));

// Build, send, pull back, or reopen a client's proposal
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  let p = (await getProposal(id)) ?? blankProposal(client);
  const now = new Date().toISOString();
  switch (b.action) {
    case "start": break;
    case "fromClient": {
      if (p.status === "accepted") return error("This proposal is accepted. Reopen it to make changes.");
      p.options = [...p.options, optionFromClient(client)].slice(0, 4);
      break;
    }
    case "save": {
      if (p.status === "accepted") return error("This proposal is accepted. Reopen it to make changes.");
      const catalog = await getCatalog();
      const options = cleanOptions(b.options, new Set(catalog.services.map((s) => s.id)));
      if (!options.length) return error("Add at least one option.");
      p.options = options;
      p.intro = String(b.intro ?? "").slice(0, 4000);
      p.expires = isDate(b.expires) ? String(b.expires) : "";
      if (b.send === true) {
        if (options.some((o) => !o.lineItems.length)) return error("Every option needs at least one price line before you send.");
        p.status = "sent"; p.sentAt = now; p.viewedAt = null;
      }
      if (b.send === false) { p.status = "draft"; p.sentAt = null; }
      break;
    }
    case "reopen": {
      // Back to a draft so you can revise it. Their earlier acceptance is cleared and they will accept the new version.
      p = { ...p, status: "draft", sentAt: null, viewedAt: null, acceptedAt: null, acceptedOptionId: "", acceptedName: "", acceptedTitle: "", acceptedIp: "" };
      break;
    }
    default: return error("Bad request.");
  }
  await saveProposal(id, p);
  return json(p);
}
