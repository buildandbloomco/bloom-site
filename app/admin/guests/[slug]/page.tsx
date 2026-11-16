import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { eventSummaries, type GuestStatus } from "@/lib/ledger";
import PrintButton from "@/components/event/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guest list", robots: { index: false, follow: false } };

const LABEL: Record<GuestStatus, string> = { paid: "Paid", comp: "Complimentary", zelle: "Zelle to confirm", unpaid: "" };

// A printable check-in list for the door: everyone with a seat, in name order, with a box to tick
export default async function GuestList({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { slug } = await params;
  const s = (await eventSummaries()).find((x) => x.e.slug === slug);
  if (!s) notFound();
  const seated = s.guests.filter((g) => g.status !== "unpaid").sort((a, b) => a.name.localeCompare(b.name));
  const zelle = seated.filter((g) => g.status === "zelle").length;
  const multi = new Set(seated.map((g) => g.tier)).size > 1;

  return (
    <main className="guestlist">
      <style>{`
        .guestlist { max-width: 900px; margin: 0 auto; padding: 32px 24px 64px; background: #fff; color: var(--ink, #2c1b13); }
        .guestlist table { width: 100%; border-collapse: collapse; font-size: 0.98rem; }
        .guestlist th { text-align: left; font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6a5c; border-bottom: 2px solid #2c1b13; padding: 8px 6px; }
        .guestlist td { border-bottom: 1px solid #ddd3c4; padding: 10px 6px; vertical-align: top; }
        .guestlist .box { width: 20px; height: 20px; border: 1.5px solid #2c1b13; border-radius: 4px; }
        .guestlist .sub { font-size: 0.82rem; color: #6b5b4e; }
        @media print { .no-print { display: none !important; } .guestlist { padding: 0; } body { background: #fff; } @page { margin: 0.5in; } }
      `}</style>
      <div className="no-print row between" style={{ marginBottom: 20 }}>
        <PrintButton />
        <a className="small" href={`/api/admin/events/guests?slug=${slug}`}>Download as a spreadsheet</a>
      </div>
      <p className="eyebrow" style={{ margin: 0 }}>Guest list</p>
      <h1 style={{ margin: "4px 0 6px", fontSize: "2rem" }}>{s.label}</h1>
      {s.e.details && <p style={{ margin: 0 }}>{s.e.details}</p>}
      <p className="sub" style={{ margin: "6px 0 18px" }}>
        {seated.length} {seated.length === 1 ? "guest" : "guests"}
        {s.seats.map((x) => ` · ${x.taken} of ${x.total} seats taken${multi ? ` (${x.tier})` : ""}`).join("")}
        {zelle ? ` · ${zelle} Zelle still to confirm` : ""} · Printed {new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" })}
      </p>
      {seated.length === 0 ? <p>No one has a seat yet.</p> : (
        <table>
          <thead><tr><th style={{ width: 34 }}>Here</th><th>Guest</th><th>Contact</th>{multi && <th>Offer</th>}<th>Notes</th></tr></thead>
          <tbody>
            {seated.map((g) => (
              <tr key={`${g.clientId}-${g.tier}-${g.gift?.to ?? ""}`}>
                <td><div className="box" /></td>
                <td><strong>{g.name}</strong></td>
                <td className="sub">{[g.email, g.phone].filter(Boolean).join(" · ") || "—"}</td>
                {multi && <td className="sub">{g.tier}</td>}
                <td className="sub">
                  {[g.status !== "paid" ? LABEL[g.status] : "", g.buyer ? `Gift from ${g.buyer.name}` : "", g.gift?.note ? `“${g.gift.note}”` : ""].filter(Boolean).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
