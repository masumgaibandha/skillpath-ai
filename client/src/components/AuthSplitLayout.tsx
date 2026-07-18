import type { LucideIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export interface AuthBenefit {
  icon: LucideIcon;
  text: string;
}

interface AuthSplitLayoutProps {
  image: StaticImageData;
  headline: string;
  description: string;
  benefits: AuthBenefit[];
  children: React.ReactNode;
}

export function AuthSplitLayout({
  image,
  headline,
  description,
  benefits,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
      {/* Branded visual panel — desktop/tablet only, collapses away on mobile
          so the form is the entire screen there. */}
      <div className="relative hidden overflow-hidden bg-zinc-900 lg:block">
        <Image src={image} alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/95 via-indigo-900/85 to-zinc-900/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[length:24px_24px]" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" aria-label="SkillPath AI — Home">
            <BrandLogo variant="horizontal" background="dark" className="h-8 w-auto" />
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white xl:text-4xl">{headline}</h2>
            <p className="mt-4 text-indigo-100">{description}</p>

            <ul className="mt-8 flex flex-col gap-4">
              {benefits.map((benefit) => (
                <li key={benefit.text} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
                    <benefit.icon size={16} />
                  </span>
                  <span className="mt-1 text-sm text-indigo-50">{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-indigo-200/70">
            © {new Date().getFullYear()} SkillPath AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:py-16">
        {children}
      </div>
    </div>
  );
}
