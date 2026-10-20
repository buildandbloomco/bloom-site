import type { Product } from "@/lib/shop-def";

/** The product's cover image, or a branded cover when none is uploaded yet */
export default function Cover({ p, size = "md" }: { p: Pick<Product, "title" | "kind" | "cover">; size?: "md" | "lg" }) {
  if (p.cover) return <img className={`sh-cover ${size}`} src={p.cover} alt={`${p.title} cover`} />;
  return (
    <div className={`sh-cover sh-drawn ${size}`} role="img" aria-label={`${p.title} cover`}>
      <span className="arch"><img src="/logo.png" alt="" /></span>
      <span className="k">{p.kind}</span>
      <strong>{p.title}</strong>
      <span className="by">Build &amp; Bloom Collective</span>
    </div>
  );
}
