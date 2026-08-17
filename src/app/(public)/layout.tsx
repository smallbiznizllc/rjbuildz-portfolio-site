import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { BackToTop } from "@/components/navigation/BackToTop";
import { RevealFooterShell } from "@/components/navigation/RevealFooterShell";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RevealFooterShell footer={<Footer />}>
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
