import { currentClient, isAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/data";
import { clientIp, error, json } from "@/lib/http";
import { fingerprint, listAgreements, saveAgreements } from "@/lib/agreements";
import { notifyAdmin } from "@/lib/notify";

// The client signs an agreement by typing their name. We record who, when, and the exact text.
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  // Your own browser previewing their portal must never be able to sign for them
  if (await isAdmin()) return error("You are previewing as the admin. Only the client can sign, from their own browser.", 403);
  if (!(await rateLimit(`sign:${client.id}`, 20, 60 * 60))) return error("Too many tries. Try again later.", 429);
  const b = await req.json().catch(() => ({}));
  const list = await listAgreements(client.id);
  const a = list.find((x) => x.id === String(b.id));
  if (!a || a.status === "draft") return error("We could not find that agreement.", 404);
  if (a.status === "signed") return error("This agreement is already signed.");
  const name = String(b.name || "").trim().slice(0, 120);
  if (name.length < 3 || !/\s/.test(name)) return error("Type your full legal name to sign.");
  if (b.agree !== true) return error("Check the box to confirm you have read and agree.");
  // If the text changed while they were reading, they must read the new version
  if (String(b.hash) !== fingerprint(a)) return error("This agreement was updated while you had it open. Refresh the page and read the latest version.", 409);
  a.status = "signed";
  a.signedAt = new Date().toISOString();
  a.signedName = name;
  a.signedTitle = String(b.title || "").trim().slice(0, 120);
  a.signedIp = await clientIp();
  a.signedHash = fingerprint(a);
  await saveAgreements(client.id, list);
  await notifyAdmin(`${client.name} signed "${a.title}"`, [`${name}${a.signedTitle ? `, ${a.signedTitle}` : ""} signed "${a.title}" for ${client.name}.`], `/admin/clients/${client.id}/agreements`);
  return json({ ok: true });
}
