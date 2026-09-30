import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import { listLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brandmark">
          <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
          <span style={{ fontSize: "0.9rem" }}>BUILD &amp; BLOOM</span>
        </div>
        <AdminNav newLeads={(await listLeads()).filter((l) => l.status === "new").length} />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
