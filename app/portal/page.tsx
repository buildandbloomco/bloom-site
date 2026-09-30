import { bookProps } from "@/lib/booking";
import { redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import GateForm from "@/components/GateForm";
import Ribbon from "@/components/Ribbon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Portal", robots: { index: false, follow: false } };

export default async function Home() {
  const client = await currentClient();
  if (client && client.status !== "archived") redirect(`/p/${client.slug}`);
  const s = await getSettings();

  return (
    <main className="gate">
      <Ribbon />
      <header className="gate-head">
        <a href="/" className="brandmark" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="" />
          <span>{s.brandName.toUpperCase()}</span>
        </a>
        <a className="btn btn-ghost btn-sm" {...bookProps(s)}>
          Book a free consult
        </a>
      </header>

      <div className="gate-body">
        <div className="stack" style={{ gap: 28 }}>
          <div className="stack" style={{ gap: 14 }}>
            <p className="eyebrow">Client portal</p>
            <h1>
              <span className="ink">Your proposal,</span> your resources,{" "}
              <span className="ink">all in one place.</span>
            </h1>
            <span className="rule" aria-hidden="true" />
          </div>

          <div className="gate-card boxed">
            <div className="stack" style={{ gap: 4 }}>
              <p style={{ fontSize: "1.2rem" }}>Enter the access code we sent you.</p>
            </div>
            <GateForm />
            <p className="small muted">
              New here? <a {...bookProps(s)}>Book a free consult</a> and
              we will talk through what you are building. No code? Email{" "}
              <a href={`mailto:${s.email}`}>{s.email}</a>
              {s.phone ? ` or call ${s.phone}` : ""}.
            </p>
          </div>
        </div>

        <div className="arch-frame" aria-hidden="true">
          <div className="back" />
          <div className="front">
            <img src="/logo.png" alt="" />
          </div>
          <span className="pill">Welcome</span>
        </div>
      </div>
    </main>
  );
}
