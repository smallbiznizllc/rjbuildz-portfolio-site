import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { BackToTop } from "@/components/navigation/BackToTop";
import { RevealFooterShell } from "@/components/navigation/RevealFooterShell";
import { getSiteSettings } from "@/lib/firestore/settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <RevealFooterShell footer={<Footer socialAccounts={settings.socialAccounts} />}>
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
