import { getSettings } from "@/lib/data";
import { emailReady } from "@/lib/invite";
import SettingsEditor from "@/components/admin/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const status = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    db: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
  };
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Settings</h2>
      </div>
      <section className="panel">
        <h3>Backup</h3>
        <p className="small muted" style={{ margin: 0 }}>Download one file with every client, plan, session room, assessment, lead, course, agreement, and setting. Keep a copy somewhere safe, like your Google Drive, about once a month. Portal access codes are left out, and uploaded files are listed by link.</p>
        <div><a className="btn btn-sm btn-dark" href="/api/admin/export">Download full backup</a></div>
      </section>
      <section className="panel">
        <h3>Email, alerts, and reminders</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>{emailReady() ? `✓ Email is on. Alerts go to ${process.env.NOTIFY_EMAIL || settings.email || "the email in your settings (add one below)"}.` : "• Email is off. Add RESEND_API_KEY and EMAIL_FROM in Vercel to get alerts and send invites."}</li>
          <li>{process.env.CRON_SECRET ? "✓ Day-before session reminders are on." : "• Session reminders are off. Add CRON_SECRET in Vercel to turn them on (see the README)."}</li>
          <li>{process.env.BLOB_READ_WRITE_TOKEN ? "✓ File sharing is on." : "• File sharing is off. Connect a Blob store in Vercel Storage."}</li>
        </ul>
      </section>
      <SettingsEditor initial={settings} status={status} />
    </div>
  );
}
