import { getSettings } from "@/lib/data";
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
      <SettingsEditor initial={settings} status={status} />
    </div>
  );
}
