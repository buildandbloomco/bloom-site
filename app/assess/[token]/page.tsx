import "@/components/portal/workspace.css";
import { assessmentByToken } from "@/lib/workspace";
import { getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import TeamSurvey from "@/components/portal/TeamSurvey";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team Wellness Survey", robots: { index: false, follow: false } };

export default async function TeamSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [a, settings] = await Promise.all([assessmentByToken(token), getSettings()]);
  const closed = !a || !a.enabled || a.status === "review" || a.status === "shared" || (!!a.closesOn && nowET().date > a.closesOn);
  return (
    <main className="section" style={{ paddingTop: 40 }}>
      <div className="wrap narrow stack" style={{ gap: 24 }}>
        <div className="brandmark">
          <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
          <span>{settings.brandName.toUpperCase()}</span>
        </div>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <p className="eyebrow">Team wellness survey</p>
          <h2>{a?.profile.orgName ? `${a.profile.orgName}: how is work working for you?` : "How is work working for you?"}</h2>
        </div>
        {closed ? (
          <div className="card"><p style={{ margin: 0 }}>This survey is closed or the link isn&rsquo;t active. If you think that&rsquo;s a mistake, ask the person who sent it to you.</p></div>
        ) : (
          <TeamSurvey token={token} org={a!.profile.orgName} />
        )}
      </div>
    </main>
  );
}
