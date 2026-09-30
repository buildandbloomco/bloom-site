import { NextResponse } from "next/server";
import { isAdmin, startClientSession } from "@/lib/auth";
import { getClient } from "@/lib/data";

// Lets you open a client's portal exactly as they see it (without changing their "last opened" date).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return NextResponse.redirect(new URL("/admin", req.url));
  await startClientSession(c.id);
  return NextResponse.redirect(new URL(`/p/${c.slug}`, req.url));
}
