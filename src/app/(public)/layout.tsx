import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { RevealFooterShell } from "@/components/navigation/RevealFooterShell";
import { getContactEmail } from "@/lib/site";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactEmail = getContactEmail();

  return (
    <RevealFooterShell
      footer={<Footer contactEmail={contactEmail} />}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </RevealFooterShell>
  );
}
