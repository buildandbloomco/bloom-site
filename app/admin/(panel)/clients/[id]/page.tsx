import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getClient } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import ClientEditor from "@/components/admin/ClientEditor";

export const dynamic = "force-dynamic";

export default async function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, catalog] = await Promise.all([getClient(id), getCatalog()]);
  if (!client) notFound();
  const code = client.codeEnc ? decryptCode(client.codeEnc) : "";
  return (
    <div className="stack" style={{ gap: 24 }}>
      <Link href="/admin" className="small">← All clients</Link>
      <ClientEditor initial={client} catalog={catalog} initialCode={code} />
    </div>
  );
}
