import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";

export function SeeItLiveButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "primary", size: "md" })}
    >
      See it live
      <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
    </a>
  );
}
