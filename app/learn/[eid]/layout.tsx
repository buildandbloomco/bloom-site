import Link from "next/link";
import { learnerContext } from "@/lib/learn";
import SignOut from "@/components/SignOut";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your course", robots: { index: false, follow: false } };

export default async function LearnLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eid: string }> }) {
  const { eid } = await params;
  const { client, course } = await learnerContext(eid);
  return (
    <>
      <header className="topbar no-print">
        <div className="wrap">
          <Link href={`/learn/${eid}`} className="brandmark" style={{ textDecoration: "none", color: "inherit" }}>
            <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
            <span className="learn-title">{course.title.toUpperCase()}</span>
          </Link>
          <div className="row">
            <Link href="/" className="linkbtn small">Website</Link>
            <Link href={`/p/${client.slug}`} className="btn btn-sm btn-ghost">My portal</Link>
            <SignOut />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
