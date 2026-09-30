import { isAdmin } from "@/lib/auth";
import { listWaitlist } from "@/lib/waitlist";
import { interestLabel } from "@/lib/wellness";

// Download the waitlist as a spreadsheet (opens in Excel, Numbers, or Google Sheets)
export async function GET() {
  if (!(await isAdmin())) return new Response("Please sign in.", { status: 401 });
  const rows = await listWaitlist();
  const cell = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Joined", "Plan", "Name", "Email", "Organization", "Role", "Team size", "Interested in", "Note", "Heard about us", "Status"];
  const lines = [head.map(cell).join(",")].concat(
    rows.map((r) => [r.createdAt.slice(0, 10), r.plan === "team" ? "Team" : "Individual", r.name, r.email, r.organization, r.role, r.teamSize, r.interests.map(interestLabel).join("; "), r.note, r.heardFrom, r.status].map(cell).join(","))
  );
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="wellness-library-waitlist.csv"` },
  });
}
