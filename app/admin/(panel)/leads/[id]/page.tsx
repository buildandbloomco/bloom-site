import { fmtTime, longDate } from "@/lib/booking";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/lib/leads";
import { getCatalog } from "@/lib/data";
import { shortDate } from "@/lib/format";
import LeadActions from "@/components/admin/LeadActions";

export const dynamic = "force-dynamic";

function Row({ k, v }: { k: string; v: string | undefined | null }) {
  if (!v) return null;
  return (
    <div className="stack" style={{ gap: 2 }}>
      <span className="tiny muted" style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>{k}</span>
      <span style={{ whiteSpace: "pre-line" }}>{v}</span>
    </div>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, catalog] = await Promise.all([getLead(id), getCatalog()]);
  if (!lead) notFound();
  const svc = (sid: string) => catalog.services.find((s) => s.id === sid)?.name ?? sid;
  const a = lead.assessment;
  return (
    <div className="stack" style={{ gap: 24 }}>
      <Link href="/admin/leads" className="small">← All leads</Link>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Inquiry · {shortDate(lead.createdAt)}</p>
        <h2>{lead.name}</h2>
        {lead.organization && <p className="muted">{[lead.role, lead.organization].filter(Boolean).join(", ")}</p>}
      </div>
      {lead.consult && (
        <div className="panel row between" style={{ borderTopColor: "var(--gold)" }}>
          <div className="stack" style={{ gap: 2 }}>
            <strong>Consult booked</strong>
            <span className="small">{longDate(lead.consult.date)} at {fmtTime(lead.consult.start)} ET</span>
          </div>
          <Link className="btn btn-sm btn-ghost" href="/admin/calendar">Open calendar</Link>
        </div>
      )}
      <div className="editor-grid">
        <div className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <h3>Contact</h3>
            <div className="grid-2" style={{ gap: 14 }}>
              <Row k="Email" v={lead.email} />
              <Row k="Phone" v={lead.phone} />
              <Row k="Website" v={lead.website} />
              <Row k="Heard about us" v={lead.heardFrom} />
            </div>
          </section>
          <section className="panel">
            <h3>What they want</h3>
            <Row k="Interested in" v={lead.interests.map(svc).join(", ")} />
            <Row k="Goals" v={lead.goals} />
            <Row k="Hardest right now" v={lead.challenges} />
            <div className="grid-2" style={{ gap: 14 }}>
              <Row k="Budget" v={lead.budget} />
              <Row k="Timeline" v={lead.timeline} />
            </div>
          </section>
          {a && (
            <section className="panel">
              <h3>Organizational snapshot</h3>
              <div className="grid-3" style={{ gap: 14 }}>
                <Row k="Direct-service staff" v={a.staffLicensed} />
                <Row k="Interns & trainees" v={a.staffInterns} />
                <Row k="Admin & support" v={a.staffAdmin} />
              </div>
              <Row k="Type of organization" v={a.serviceAreas.join(", ")} />
              <Row k="Work intensity" v={a.caseIntensity ? `${a.caseIntensity} / 10` : ""} />
              <Row k="Signs of strain" v={a.fatigueSigns.join("\n")} />
              <Row k="Support after hard situations" v={a.crisisProtocol} />
              <Row k="Weekly direct-service hours" v={a.billableHours} />
              <Row k="Decompression" v={a.decompression} />
              <Row k="Team support" v={a.supervision} />
              <Row k="Where the model conflicts with well-being" v={a.modelConflict} />
              <Row k="Desired outcomes" v={a.outcomes.join("\n")} />
              <Row k="Cultural & identity dynamics" v={a.identityDynamics} />
            </section>
          )}
        </div>
        <div className="sticky-col">
          <LeadActions lead={lead} />
        </div>
      </div>
    </div>
  );
}
