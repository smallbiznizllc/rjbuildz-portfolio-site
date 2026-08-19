import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export const SITE_LOGO_SRC = "/brand/rjo-logo.png";

export function SiteLogo({
  size = 40,
  priority = false,
  className,
  tone = "original",
}: {
  size?: number;
  priority?: boolean;
  className?: string;
  tone?: "original" | "copper";
}) {
  if (tone === "copper") {
    return (
      <span
        aria-hidden
        className={cn("inline-block shrink-0 bg-copper", className)}
        style={{
          width: size,
          height: size,
          WebkitMaskImage: `url(${SITE_LOGO_SRC})`,
          maskImage: `url(${SITE_LOGO_SRC})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  return (
    <Image
      src={SITE_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
