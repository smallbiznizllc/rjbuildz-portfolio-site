import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${dmSans.variable} min-h-screen bg-zinc-100 font-[family-name:var(--font-dm-sans)] text-zinc-900 antialiased`}
    >
      {children}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
