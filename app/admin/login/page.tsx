import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminLogin from "@/components/admin/AdminLogin";
import Ribbon from "@/components/Ribbon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="gate">
      <Ribbon />
      <div className="gate-panel" style={{ flex: 1, padding: "48px 20px" }}>
        <div className="gate-card boxed">
          <div className="brandmark">
            <img src="/logo.png" alt="" />
            <span>BUILD &amp; BLOOM ADMIN</span>
          </div>
          <h2 style={{ fontSize: "2rem" }}>Sign in</h2>
          <AdminLogin />
        </div>
      </div>
    </main>
  );
}
