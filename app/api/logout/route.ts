import { endClientSession } from "@/lib/auth";
import { json } from "@/lib/http";

export async function POST() {
  await endClientSession();
  return json({ ok: true });
}
