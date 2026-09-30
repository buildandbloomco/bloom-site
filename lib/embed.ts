/**
 * Turn a sharing link into a link that can be shown inside the portal.
 * Works for Google Docs, Sheets, Slides, Forms, Drive files and folders, YouTube, Vimeo, and Loom.
 * The file must be shared as "Anyone with the link can view" (or the client must be signed in to a
 * Google account that has access).
 */
export function embedUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;

  if (host === "docs.google.com") {
    const m = path.match(/^\/(document|spreadsheets|presentation|forms)\/d\/(e\/)?([^/]+)/);
    if (!m) return null;
    const [, kind, pub, id] = m;
    const base = `https://docs.google.com/${kind}/d/${pub ?? ""}${id}`;
    if (kind === "presentation") return `${base}/embed?start=false&loop=false`;
    if (kind === "forms") return `${base}/viewform?embedded=true`;
    return `${base}/preview`;
  }
  if (host === "drive.google.com") {
    const folder = folderId(url);
    if (folder) return `https://drive.google.com/embeddedfolderview?id=${folder}#grid`;
    const f = path.match(/\/file\/d\/([^/]+)/) || (u.searchParams.get("id") ? [null, u.searchParams.get("id")] : null);
    if (f && f[1]) return `https://drive.google.com/file/d/${f[1]}/preview`;
    return null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = u.searchParams.get("v") || path.match(/^\/(shorts|embed)\/([^/]+)/)?.[2];
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${path.slice(1)}`;
  if (host === "vimeo.com") {
    const id = path.match(/^\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === "loom.com") {
    const id = path.match(/^\/share\/([^/]+)/)?.[1];
    return id ? `https://www.loom.com/embed/${id}` : null;
  }
  return null;
}

export function folderId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("drive.google.com")) return null;
    const m = u.pathname.match(/\/folders\/([^/?]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function isGoogle(url: string): boolean {
  return /^https:\/\/(docs|drive)\.google\.com\//i.test(url);
}
