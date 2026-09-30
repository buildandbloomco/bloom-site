import { findClientByCode, rateLimit, writeClientRaw } from "@/lib/data";
import { startClientSession } from "@/lib/auth";
import { clientIp, error, json } from "@/lib/http";

export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`access:${ip}`, 10, 15 * 60))) {
    return error("Too many tries. Please wait 15 minutes, or reach out and we will help.", 429);
  }
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "");
  const client = await findClientByCode(code);
  if (!client || client.status === "archived") {
    return error("That code did not match. Check your email for your access code, or reach out and we will help.", 401);
  }
  client.lastViewedAt = new Date().toISOString();
  if (client.status === "draft") client.status = "sent";
  await writeClientRaw(client);
  await startClientSession(client.id);
  return json({ ok: true, slug: client.slug });
}
