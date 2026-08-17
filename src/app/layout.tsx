import type { Metadata } from "next";
import { Slabo_27px, Ultra } from "next/font/google";
import { Toaster } from "sonner";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://rjbuildz.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RJ Buildz — Creative Portfolio",
    template: "%s · RJ Buildz",
  },
  description:
    "RJ Buildz — a professional creative portfolio of design, build, and craft work.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RJ Buildz",
    title: "RJ Buildz — Creative Portfolio",
    description:
      "RJ Buildz — a professional creative portfolio of design, build, and craft work.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RJ Buildz — Creative Portfolio",
    description:
      "RJ Buildz — a professional creative portfolio of design, build, and craft work.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
