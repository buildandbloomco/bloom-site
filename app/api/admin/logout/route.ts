import { endAdminSession } from "@/lib/auth";
import { json } from "@/lib/http";

export async function POST() {
  await endAdminSession();
  return json({ ok: true });
}
