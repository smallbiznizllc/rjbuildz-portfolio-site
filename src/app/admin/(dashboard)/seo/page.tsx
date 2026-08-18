import { AdminShell } from "@/components/admin/AdminShell";
import { GlobalSeoForm } from "@/components/admin/GlobalSeoForm";
import { getSiteSettings } from "@/lib/firestore/settings";

export default async function GlobalSeoPage() {
  const settings = await getSiteSettings();

  return (
    <AdminShell title="SEO">
      <GlobalSeoForm initial={settings.seo} />
    </AdminShell>
  );
}
