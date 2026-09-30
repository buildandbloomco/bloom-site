import "@/components/library/library.css";
import Link from "next/link";
import { getLibrarySettings, listMembers, listPieces } from "@/lib/library";
import { listClients } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import { typeLabel } from "@/lib/wellness-types";
import NewPiece from "@/components/admin/NewPiece";
import LibraryMembers from "@/components/admin/LibraryMembers";
import LibrarySettingsEditor from "@/components/admin/LibrarySettingsEditor";

export const dynamic = "force-dynamic";

const TABS = [["pieces", "Pieces"], ["members", "Members"], ["settings", "Home page & affirmations"]] as const;

export default async function WellnessAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab : "pieces";
  const [pieces, members, settings, clients] = await Promise.all([listPieces(), listMembers(), getLibrarySettings(), listClients()]);
  const live = pieces.filter((p) => p.status === "published").length;
  const waitingAudio = pieces.filter((p) => p.type === "audio" && !p.audioUrl).length;
  const collections = [...new Set(pieces.map((p) => p.collection))];

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Admin</p>
          <h2>Wellness Library</h2>
          <p className="muted small">{live} of {pieces.length} pieces published · {members.filter((m) => m.status === "active").length} active members{waitingAudio ? ` · ${waitingAudio} audio pieces waiting on recordings` : ""}</p>
        </div>
        <a className="btn btn-sm btn-ghost" href="/library" target="_blank" rel="noopener noreferrer">Preview the library ↗</a>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/wellness?tab=${k}`} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""}>{label}</Link>
        ))}
      </div>

      {tab === "pieces" && (
        <div className="stack" style={{ gap: 20 }}>
          {collections.map((c) => (
            <section key={c} className="stack" style={{ gap: 10 }}>
              <h3>{c}</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Piece</th><th>Type</th><th>Status</th><th>Your to-do</th><th><span className="sr-only">Open</span></th></tr></thead>
                  <tbody>
                    {pieces.filter((p) => p.collection === c).map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.title}</strong><div className="tiny muted">{p.minutes ? `${p.minutes} min · ` : ""}{p.teamOnly ? "Teams only" : "All members"}</div></td>
                        <td className="small">{typeLabel(p.type)}</td>
                        <td><span className={`tag ${p.status === "published" ? "green" : ""}`}>{p.status === "published" ? "Published" : "Draft"}</span></td>
                        <td className="small">{p.adminNote || (p.type === "audio" && !p.audioUrl ? "Add the recording link" : "")}</td>
                        <td><div className="row" style={{ gap: 8, flexWrap: "nowrap" }}><Link className="btn btn-sm btn-ghost" href={`/admin/wellness/${p.id}`}>Edit</Link><a className="linkbtn small" href={`/library/${p.slug}`} target="_blank" rel="noopener noreferrer">View</a></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          <NewPiece collections={collections} />
        </div>
      )}

      {tab === "members" && (
        <LibraryMembers
          members={members.map((m) => {
            const c = clients.find((x) => x.id === m.clientId);
            return { ...m, name: c?.name ?? "Removed client", email: c?.email ?? "", slug: c?.slug ?? "", code: c?.codeEnc ? decryptCode(c.codeEnc) : "" };
          })}
          clients={clients.filter((c) => c.status !== "archived" && !members.some((m) => m.clientId === c.id)).map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        />
      )}

      {tab === "settings" && <LibrarySettingsEditor initial={settings} />}
    </div>
  );
}
