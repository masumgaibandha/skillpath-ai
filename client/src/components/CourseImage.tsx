"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

interface CourseImageProps {
  src: string;
  alt: string;
  className?: string;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Drop-in replacement for `<Image fill .../>` when the src is a
 * user-submitted URL (course images from /items/add, of any host) rather
 * than a local asset or a known/allowlisted remote host. next/image
 * requires every remote hostname to be explicitly allowlisted in
 * next.config.ts, which doesn't scale to arbitrary user-submitted URLs —
 * and even a syntactically valid URL (e.g. an ImgBB *page* link like
 * https://ibb.co/xxxx, not the actual image resource) isn't necessarily a
 * real image at all. This renders a plain <img>, validates the URL before
 * attempting to load it, and falls back to a placeholder icon on either an
 * invalid URL or a real load failure (404, non-image content, dead host).
 *
 * Callers keep the same sized `relative` wrapper div they'd use for
 * `<Image fill />` (e.g. `aspect-video`) — that wrapper is what prevents
 * layout shift; this component just fills it, exactly like `fill` does.
 */
export function CourseImage({ src, alt, className }: CourseImageProps) {
  const [broken, setBroken] = useState(false);
  const showFallback = !isValidHttpUrl(src) || broken;

  if (showFallback) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
        <ImageOff size={24} className="text-zinc-300" aria-hidden="true" />
        <span className="sr-only">{alt} (image unavailable)</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`}
      onError={() => setBroken(true)}
    />
  );
}
