import { AdminShell } from "@/components/admin/AdminShell";
import { SocialAccountsForm } from "@/components/admin/SocialAccountsForm";
import { getSiteSettings } from "@/lib/firestore/settings";

export default async function SocialAccountsPage() {
  const settings = await getSiteSettings();

  return (
    <AdminShell title="Social accounts">
      <SocialAccountsForm
        initial={settings.socialAccounts.map((account) => ({
          id: account.id,
          network: account.network,
          handle: account.handle,
          href: account.href,
          sortOrder: account.sortOrder,
        }))}
      />
    </AdminShell>
  );
}
