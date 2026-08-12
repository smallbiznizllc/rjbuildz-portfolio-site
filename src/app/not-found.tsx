import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f3eb] text-[#1a1814] antialiased">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#b87333]">
            404
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Page not found
          </h1>
          <p className="mt-4 text-[#5c564c] leading-relaxed">
            That page doesn&apos;t exist or may have moved.
          </p>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "primary" }),
              "mt-8 bg-[#b87333] text-white px-5 py-3 inline-flex",
            )}
          >
            Back home
          </Link>
        </div>
      </body>
    </html>
  );
}
