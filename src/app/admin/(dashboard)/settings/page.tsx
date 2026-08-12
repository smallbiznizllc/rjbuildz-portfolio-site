import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/firestore/settings";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <AdminShell title="Settings">
      <SettingsForm
        initial={{
          siteName: settings.siteName,
          owner: settings.owner,
          aboutBlurb: settings.aboutBlurb,
          tagline: settings.tagline,
          contactEmail: settings.contactEmail,
        }}
      />
    </AdminShell>
  );
}
