import { CodeTakenError, getClient, setClientCode } from "@/lib/data";
import { generateCode } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

// Set a new access code (blank = generate one). The old code stops working immediately.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim() || generateCode();
  try {
    await setClientCode(c, code);
  } catch (e) {
    return error(e instanceof CodeTakenError || e instanceof Error ? e.message : "Could not set code.");
  }
  return json({ code: code.toUpperCase().replace(/\s+/g, "") });
}
