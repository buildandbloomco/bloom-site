import { blankClient, getCatalog, getSettings, saveClient, setClientCode, uniqueSlug } from "@/lib/data";
import { getLead, saveLead } from "@/lib/leads";
import { generateCode, newId } from "@/lib/crypto";
import { blankConsult, FOCUS_AREAS } from "@/lib/consult";
import { error, json, requireAdmin } from "@/lib/http";
import { firstName } from "@/lib/format";

// Turn a website inquiry into a client portal, with a consultation sheet already filled in from their answers
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) return error("Lead not found.", 404);
  if (lead.clientId) return json({ clientId: lead.clientId });

  const [settings, catalog] = await Promise.all([getSettings(), getCatalog()]);
  const name = lead.organization || lead.name;
  const client = blankClient(name, settings);
  client.slug = await uniqueSlug(name);
  client.contactName = firstName(lead.name);
  client.email = lead.email;
  client.notes = `From website inquiry on ${lead.createdAt.slice(0, 10)}. ${lead.notes}`.trim();
  client.addOnIds = catalog.services.filter((s) => s.kind === "addon" && s.active).map((s) => s.id);

  const sheet = blankConsult(newId(), name);
  sheet.attendees = `${lead.name}${lead.role ? ` (${lead.role})` : ""}, Jadon`;
  sheet.about.links = lead.website;
  sheet.goals = lead.goals;
  sheet.challenges = lead.challenges;
  sheet.budget = lead.budget;
  sheet.keyDates = lead.timeline ? `Timeline from inquiry: ${lead.timeline}` : "";
  sheet.tier = lead.lane === "orgs" ? "org" : lead.lane === "business" ? "business" : "";
  client.tier = sheet.tier;
  sheet.serviceIds = lead.interests.filter((i) => catalog.services.some((s) => s.id === i));
  const a = lead.assessment;
  if (a) {
    const staff = [
      a.staffLicensed && `${a.staffLicensed} direct-service staff`,
      a.staffInterns && `${a.staffInterns} interns/trainees`,
      a.staffAdmin && `${a.staffAdmin} admin/support`,
    ].filter(Boolean);
    sheet.about.teamSize = staff.join(", ");
    sheet.about.offer = a.serviceAreas.length ? `Type of organization: ${a.serviceAreas.join(", ")}` : "";
    const focus = new Set<string>();
    if (a.fatigueSigns.length) focus.add("Team capacity & burnout");
    if (a.outcomes.some((o) => o.includes("schedules"))) focus.add("Systems & operations");
    if (a.outcomes.some((o) => o.includes("Leadership"))) focus.add("Leadership & communication");
    if (a.outcomes.some((o) => o.includes("practices"))) focus.add("Workshops & training");
    sheet.focusAreas = [...focus].filter((f) => FOCUS_AREAS.includes(f));
    sheet.privateNotes = [
      "ORGANIZATIONAL SNAPSHOT (from their inquiry)",
      a.caseIntensity && `Work intensity: ${a.caseIntensity}/10`,
      a.fatigueSigns.length && `Signs of strain: ${a.fatigueSigns.join("; ")}`,
      a.crisisProtocol && `Support after hard situations: ${a.crisisProtocol}`,
      a.billableHours && `Weekly direct-service hours: ${a.billableHours}`,
      a.decompression && `Decompression: ${a.decompression}`,
      a.supervision && `Team support: ${a.supervision}`,
      a.modelConflict && `Where the model conflicts with well-being: ${a.modelConflict}`,
      a.outcomes.length && `Desired outcomes: ${a.outcomes.join("; ")}`,
      a.identityDynamics && `Cultural/identity dynamics: ${a.identityDynamics}`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (lead.heardFrom) sheet.privateNotes = `${sheet.privateNotes}\nHeard about us: ${lead.heardFrom}`.trim();
  client.consults = [sheet];
  await saveClient(client);
  for (let i = 0; i < 5; i++) {
    try {
      await setClientCode(client, generateCode());
      break;
    } catch {
      /* retry */
    }
  }
  lead.clientId = client.id;
  lead.status = "converted";
  await saveLead(lead);
  return json({ clientId: client.id, consultId: sheet.id });
}
