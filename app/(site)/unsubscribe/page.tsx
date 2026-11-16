import { readUnsubToken } from "@/lib/email";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email preferences", robots: { index: false, follow: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const sp = await searchParams;
  const email = readUnsubToken(sp.t ?? null);
  const s = await getSettings();
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="card stack" style={{ gap: 14, padding: 32 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Email preferences</p>
          {!email ? (
            <p style={{ margin: 0 }}>This link has expired. Reply to any of our emails and we&rsquo;ll take you off the list.</p>
          ) : sp.done === "1" ? (
            <>
              <h2 style={{ margin: 0 }}>You&rsquo;re unsubscribed</h2>
              <p style={{ margin: 0 }}>We won&rsquo;t send newsletters or announcements to <strong>{email}</strong>. You&rsquo;ll still get emails about anything you buy or book, like receipts and session details.</p>
              <form method="post" action="/api/email/unsubscribe"><input type="hidden" name="t" value={sp.t} /><input type="hidden" name="from" value="page" /><input type="hidden" name="action" value="resubscribe" /><button className="linkbtn small" type="submit">Changed your mind? Subscribe again</button></form>
            </>
          ) : (
            <>
              <h2 style={{ margin: 0 }}>{sp.done === "back" ? "Welcome back" : "Unsubscribe?"}</h2>
              <p style={{ margin: 0 }}>{sp.done === "back" ? <>You&rsquo;ll get emails from {s.brandName} at <strong>{email}</strong> again.</> : <>Stop newsletters and announcements from {s.brandName} to <strong>{email}</strong>.</>}</p>
              {sp.done !== "back" && <form method="post" action="/api/email/unsubscribe"><input type="hidden" name="t" value={sp.t} /><input type="hidden" name="from" value="page" /><button className="btn btn-primary" type="submit">Unsubscribe</button></form>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
