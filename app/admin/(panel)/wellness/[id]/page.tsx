import "@/components/library/library.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPiece, listPieces } from "@/lib/library";
import PieceEditor from "@/components/admin/PieceEditor";

export const dynamic = "force-dynamic";

export default async function EditPiece({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [piece, all] = await Promise.all([getPiece(id), listPieces()]);
  if (!piece) notFound();
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href="/admin/wellness" className="small">&larr; Wellness Library</Link>
      <PieceEditor initial={piece} collections={[...new Set(all.map((p) => p.collection))]} />
    </div>
  );
}
