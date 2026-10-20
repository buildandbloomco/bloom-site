import "@/components/event/event.css";
import "@/components/tools/tools.css";
import { notFound } from "next/navigation";
import { getTool } from "@/lib/tools-def";
import { getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { bookProps } from "@/lib/booking";
import PublicTool from "@/components/tools/PublicTool";

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const t = getTool((await params).tool);
  return t?.publicFree ? { title: `${t.name} (free)`, description: t.blurb } : {};
}

export default async function FreeTool({ params }: { params: Promise<{ tool: string }> }) {
  const tool = getTool((await params).tool);
  if (!tool || !tool.publicFree) notFound();
  const s = await getSettings();
  const book = bookProps(s) as { href?: string };
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Free tool · {tool.minutes}</p>
          <h1 style={{ marginTop: 16 }}>{tool.name}</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">{tool.blurb}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap" style={{ maxWidth: 980 }}>
          <PublicTool tool={tool} today={nowET().date} bookHref={book.href || "/contact"} debriefHref={(bookProps(s, "?type=debrief") as { href?: string }).href} />
        </div>
      </section>
    </>
  );
}
