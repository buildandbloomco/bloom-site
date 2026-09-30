import { currentClient } from "@/lib/auth";
import { rateLimit, saveClient } from "@/lib/data";
import { error, json } from "@/lib/http";

// The client confirms a shared consultation summary (and can add anything we missed)
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (!(await rateLimit(`consult:${client.id}`, 30, 60 * 60))) return error("Too many tries. Try again later.", 429);
  const b = await req.json().catch(() => ({}));
  const sheet = client.consults.find((x) => x.id === String(b.consultId) && x.shared);
  if (!sheet) return error("We could not find that summary.", 404);
  const name = String(b.name || "").trim().slice(0, 120);
  if (!name) return error("Please add your name.");
  sheet.clientConfirmedBy = name;
  sheet.clientComment = String(b.comment || "").slice(0, 3000);
  sheet.clientConfirmedAt = new Date().toISOString();
  await saveClient(client);
  return json({ ok: true, at: sheet.clientConfirmedAt });
}
