import { listContent } from "@/lib/content";
import ContentBoard from "@/components/admin/ContentBoard";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  return <ContentBoard initial={await listContent()} />;
}
