import { getCatalog } from "@/lib/data";
import { listEvents } from "@/lib/events";
import { siteOrigin } from "@/lib/http";
import EventsEditor from "@/components/admin/EventsEditor";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, catalog, origin] = await Promise.all([listEvents(), getCatalog(), siteOrigin()]);
  const services = catalog.services.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name, price: s.price ?? null }));
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Event offers</h2>
        <p className="small muted" style={{ margin: 0 }}>Private offer pages for events. Guests scan the QR code, enter the room code, and can pay and become clients right there. Your regular prices live under Services &amp; add-ons.</p>
      </div>
      <EventsEditor initial={events} services={services} origin={origin} />
    </div>
  );
}
