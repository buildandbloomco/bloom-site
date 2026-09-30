import { getAccess, saveAccess } from "@/lib/library";
import { findOrCreateClient } from "@/lib/enroll";
import { getClient } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

// Give someone access to the Wellness Library (an existing client or a new person)
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  let clientId = String(b.clientId || "");
  let created = false;
  if (clientId) {
    if (!(await getClient(clientId))) return error("Client not found.");
  } else {
    const name = String(b.name || "").trim().slice(0, 120);
    const email = String(b.email || "").trim().slice(0, 200);
    if (!name) return error("Add their name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Add a valid email.");
    const r = await findOrCreateClient(name, email);
    clientId = r.client.id;
    created = r.created;
  }
  const existing = await getAccess(clientId);
  await saveAccess({
    clientId,
    plan: b.plan === "team" ? "team" : "individual",
    teamName: b.plan === "team" ? String(b.teamName || "").trim().slice(0, 200) : "",
    status: "active",
    founding: !!b.founding,
    since: existing?.since ?? new Date().toISOString(),
    note: String(b.note || "").slice(0, 500),
  });
  const c = await getClient(clientId);
  return json({ ok: true, clientId, created, code: c?.codeEnc ? decryptCode(c.codeEnc) : "" });
}
