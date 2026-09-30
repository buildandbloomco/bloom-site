import Link from "next/link";
import { redirect } from "next/navigation";
import { libraryViewer } from "@/lib/library";
import SignOut from "@/components/SignOut";
import "@/components/library/library.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Wellness Library", robots: { index: false, follow: false } };

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const v = await libraryViewer();
  if (!v) redirect("/portal");
  return (
    <>
      <header className="topbar no-print">
        <div className="wrap">
          <Link href="/library" className="brandmark" style={{ textDecoration: "none", color: "inherit" }}>
            <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
            <span className="learn-title">THE WELLNESS LIBRARY</span>
          </Link>
          <div className="row" style={{ gap: 10 }}>
            <Link href="/" className="linkbtn small">Website</Link>
            {v.client && <Link href={`/p/${v.client.slug}`} className="btn btn-sm btn-ghost">My portal</Link>}
            {v.preview ? <Link href="/admin/wellness" className="btn btn-sm btn-ghost">Back to admin</Link> : <SignOut />}
          </div>
        </div>
      </header>
      {v.preview && <div className="lib-preview no-print">Preview mode: you are seeing every piece, including drafts and team tools. Journaling doesn&rsquo;t save here.</div>}
      {children}
    </>
  );
}
