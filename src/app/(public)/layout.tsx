import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { RevealFooterShell } from "@/components/navigation/RevealFooterShell";
import { safeGetCategories } from "@/lib/firestore/safe-public";
import { getContactEmail } from "@/lib/site";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await safeGetCategories();
  const contactEmail = getContactEmail();

  return (
    <RevealFooterShell
      footer={
        <Footer categories={categories} contactEmail={contactEmail} />
      }
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
