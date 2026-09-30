import { NextResponse } from "next/server";
import { isAdmin, startClientSession } from "@/lib/auth";
import { getEnrollment } from "@/lib/courses";

// Open the course exactly as this learner sees it
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));
  const { id } = await ctx.params;
  const e = await getEnrollment(id);
  if (!e) return NextResponse.redirect(new URL("/admin/courses", req.url));
  await startClientSession(e.clientId);
  return NextResponse.redirect(new URL(`/learn/${e.id}`, req.url));
}
