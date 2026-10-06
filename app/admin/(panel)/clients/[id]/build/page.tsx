import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/data";
import { getBuild } from "@/lib/builds";
import { listFiles } from "@/lib/files";
import BuildAdmin from "@/components/admin/BuildAdmin";
import SharedFiles from "@/components/SharedFiles";

export const dynamic = "force-dynamic";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [build, files] = await Promise.all([getBuild(id), listFiles(id)]);
  return (
    <div className="stack" style={{ gap: 22, maxWidth: 940 }}>
      <Link href={`/admin/clients/${id}/desk`} className="small no-print">&larr; {client.name}</Link>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Systems build</p>
        <h2 style={{ margin: 0 }}>{client.name}</h2>
        <p className="muted no-print" style={{ margin: 0 }}>Gather everything you need for the build, keep them posted on progress, and answer add-on requests. Use &ldquo;Fill in or edit&rdquo; to complete the questionnaire with them during the consultation.</p>
      </div>
      <BuildAdmin clientId={id} slug={client.slug} initial={build} />
      <section className="panel no-print">
        <h3>Logo, photos, and brand files</h3>
        <SharedFiles initial={files} as="us" clientId={id} />
      </section>
    </div>
  );
}
