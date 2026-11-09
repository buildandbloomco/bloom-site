import Link from "next/link";

/** Tabs that join two admin pages into one section, e.g. Shop + Books & Tools */
export default function SectionTabs({ tabs, on }: { tabs: [href: string, label: string][]; on: string }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} role="tab" aria-selected={on === href} className={on === href ? "on" : ""}>{label}</Link>
      ))}
    </div>
  );
}

export const SHOP_TABS: [string, string][] = [["/admin/shop", "Shop"], ["/admin/library", "Books & Tools in portals"]];
