import { notFound } from "next/navigation";
import Link from "next/link";
import { getContent, listContent } from "@/lib/content";
import ContentEditor from "@/components/admin/ContentEditor";

export const dynamic = "force-dynamic";

export default async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, all] = await Promise.all([getContent(id), listContent()]);
  if (!post) notFound();
  const dated = all.filter((p) => p.date);
  const i = dated.findIndex((p) => p.id === id);
  const prev = i > 0 ? dated[i - 1] : null;
  const next = i >= 0 && i < dated.length - 1 ? dated[i + 1] : null;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row between">
        <Link href="/admin/content" className="small">&larr; Content</Link>
        <div className="row" style={{ gap: 14 }}>
          {prev && <Link href={`/admin/content/${prev.id}`} className="small">&larr; Previous post</Link>}
          {next && <Link href={`/admin/content/${next.id}`} className="small">Next post &rarr;</Link>}
        </div>
      </div>
      <ContentEditor key={post.id} initial={post} campaigns={[...new Set(all.map((p) => p.campaign).filter(Boolean))]} />
    </div>
  );
}
