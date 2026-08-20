import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { BackToTop } from "@/components/navigation/BackToTop";
import { RevealFooterShell } from "@/components/navigation/RevealFooterShell";
import { GlobalTracking } from "@/components/seo/GlobalTracking";
import { safeGetSiteSettings } from "@/lib/firestore/safe-public";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await safeGetSiteSettings();

  return (
    <RevealFooterShell footer={<Footer socialAccounts={settings.socialAccounts} />}>
      <GlobalTracking seo={settings.seo} />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <BackToTop />
    </RevealFooterShell>
  );
}
