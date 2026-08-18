import type { Metadata } from "next";
import { Slabo_27px, Ultra } from "next/font/google";
import { Toaster } from "sonner";
import { safeGetSiteSettings } from "@/lib/firestore/safe-public";
import { buildRootMetadata, DEFAULT_GLOBAL_SEO } from "@/lib/seo/global";
import "./globals.css";

const slabo = Slabo_27px({
  variable: "--font-slabo",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const ultra = Ultra({
  variable: "--font-ultra",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await safeGetSiteSettings();
  return buildRootMetadata(settings.seo ?? DEFAULT_GLOBAL_SEO);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${slabo.variable} ${ultra.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-charcoal font-sans text-ink">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "var(--parchment-soft)",
              color: "var(--ink)",
              border: "1px solid var(--border-subtle)",
            },
          }}
        />
      </body>
    </html>
  );
}
