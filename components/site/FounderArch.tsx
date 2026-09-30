import fs from "fs";
import path from "path";

/** Shows public/founder.jpg (or .png/.webp) if you add one, otherwise the logo */
function founderPhoto(): string | null {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    if (fs.existsSync(path.join(process.cwd(), "public", `founder.${ext}`))) return `/founder.${ext}`;
  }
  return null;
}

export default function FounderArch({ pill = "Founder" }: { pill?: string }) {
  const photo = founderPhoto();
  return (
    <div className="arch-frame">
      <div className="back" />
      <div className="front" style={photo ? { background: "var(--tan)" } : undefined}>
        {photo ? (
          <img src={photo} alt="Jadon Thomas, founder of Build & Bloom Collective" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <img src="/logo.png" alt="" />
        )}
      </div>
      <span className="pill">{pill}</span>
    </div>
  );
}
