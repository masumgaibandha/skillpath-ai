import Image from "next/image";
import horizontalDark from "@/assets/skillpath-horizontal-dark.png";
import horizontalLight from "@/assets/skillpath-horizontal-light.png";
import iconDark from "@/assets/skillpath-icon-dark.png";
import iconLight from "@/assets/skillpath-icon-light.png";

// Each asset's ink color was inspected with sharp (averaging only the
// opaque pixels): "-light" files render dark indigo ink, meant to sit on a
// light background; "-dark" files render light/near-white ink, meant to
// sit on a dark background. Naming refers to the *background* the file was
// designed for, not the ink color itself.
const LOGOS = {
  horizontal: { light: horizontalLight, dark: horizontalDark },
  icon: { light: iconLight, dark: iconDark },
} as const;

interface BrandLogoProps {
  variant?: "horizontal" | "icon";
  /** Which background this logo will sit on — picks the readable ink color. */
  background?: "light" | "dark";
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "horizontal",
  background = "light",
  className,
  priority,
}: BrandLogoProps) {
  const src = LOGOS[variant][background];
  return (
    <Image
      src={src}
      alt="SkillPath AI"
      priority={priority}
      className={className ?? (variant === "horizontal" ? "h-8 w-auto" : "h-8 w-8")}
    />
  );
}
