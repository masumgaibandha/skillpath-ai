"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface HeroSlide {
  image: StaticImageData;
  imageAlt: string;
  headline: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Re-armed on every slide change (manual or automatic) so a manual
  // interaction doesn't get immediately overridden by a stale timer.
  useEffect(() => {
    if (prefersReducedMotion || isPaused || slides.length <= 1) return;
    const id = setTimeout(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [current, isPaused, prefersReducedMotion, slides.length]);

  function goTo(index: number) {
    setCurrent(((index % slides.length) + slides.length) % slides.length);
  }
  function goPrev() {
    goTo(current - 1);
  }
  function goNext() {
    goTo(current + 1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsPaused(false);
      }}
      className="relative h-[60vh] overflow-hidden focus:outline-none sm:h-[65vh] lg:h-[70vh]"
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${current * 100}%)`,
          transition: prefersReducedMotion ? "none" : "transform 700ms ease-in-out",
        }}
      >
        {slides.map((slide, i) => (
          <div key={slide.headline} className="relative h-full w-full shrink-0" aria-hidden={i !== current}>
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
            <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-20 sm:justify-center sm:px-6 sm:pb-0">
              <span className="w-fit rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur">
                AI-powered learning
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {slide.headline}
              </h1>
              <p className="mt-4 max-w-xl text-base text-zinc-200 sm:text-lg">{slide.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={slide.primaryCta.href}
                  className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {slide.primaryCta.label}
                </Link>
                {slide.secondaryCta && (
                  <Link
                    href={slide.secondaryCta.href}
                    className="rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                  >
                    {slide.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25 sm:left-5"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25 sm:right-5"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.headline}
                type="button"
                aria-label={`Go to slide ${i + 1}: ${slide.headline}`}
                aria-current={i === current}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
