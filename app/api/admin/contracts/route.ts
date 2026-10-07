import { error, json, requireAdmin } from "@/lib/http";
import { getContractSettings, saveContractSettings } from "@/lib/agreements";

// How the automatic client contract behaves, and its wording
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const cur = await getContractSettings();
  const next = {
    mode: b.mode === "send" || b.mode === "draft" || b.mode === "off" ? b.mode : cur.mode,
    requiredToPay: typeof b.requiredToPay === "boolean" ? b.requiredToPay : cur.requiredToPay,
    state: typeof b.state === "string" ? b.state.trim().slice(0, 60) || "Georgia" : cur.state,
    template: typeof b.template === "string" ? b.template.slice(0, 40000) : cur.template,
  };
  if (next.template.trim() && !next.template.includes("{{CLIENT}}")) return error("Keep {{CLIENT}} somewhere in the template so each agreement names the client.");
  await saveContractSettings(next);
  return json(next);
}
