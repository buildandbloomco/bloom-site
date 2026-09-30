import { bookHref } from "@/lib/booking";
import { getSettings } from "@/lib/data";
import Ribbon from "@/components/Ribbon";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <Ribbon />
      <SiteHeader bookingUrl={bookHref(s)} />
      <main>{children}</main>
      <SiteFooter s={s} />
    </>
  );
}
