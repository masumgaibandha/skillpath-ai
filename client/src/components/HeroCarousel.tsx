"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  type KeyboardEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

export interface HeroSlide {
  image: StaticImageData;
  imageAlt: string;
  headline: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

const AUTOPLAY_MS = 6000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

  mediaQuery.addEventListener("change", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (prefersReducedMotion || isPaused || slides.length <= 1) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCurrent((previous) => (previous + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [current, isPaused, prefersReducedMotion, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  function goTo(index: number) {
    setCurrent(((index % slides.length) + slides.length) % slides.length);
  }

  function goPrev() {
    goTo(current - 1);
  }

  function goNext() {
    goTo(current + 1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        const nextFocusedElement = event.relatedTarget as Node | null;

        if (!event.currentTarget.contains(nextFocusedElement)) {
          setIsPaused(false);
        }
      }}
      className="relative overflow-hidden bg-zinc-950 focus:outline-none"
    >
      <div
        className="flex items-stretch"
        style={{
          transform: `translateX(-${current * 100}%)`,
          transition: prefersReducedMotion
            ? "none"
            : "transform 700ms ease-in-out",
        }}
      >
        {slides.map((slide, index) => {
          const isActive = index === current;

          return (
            <article
              key={slide.headline}
              aria-hidden={!isActive}
              className="relative min-h-[calc(100svh-4rem)] w-full shrink-0 sm:min-h-[560px] lg:min-h-[640px]"
            >
              <Image
                src={slide.image}
                alt={slide.imageAlt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/25 sm:from-black/80 sm:via-black/45 sm:to-black/15" />

              <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center px-4 pb-24 pt-10 sm:min-h-[560px] sm:px-16 sm:py-16 lg:min-h-[640px] lg:px-20">
                <div className="max-w-2xl">
                  <span className="inline-flex w-fit rounded-full border border-indigo-300/20 bg-indigo-500/25 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur-sm">
                    AI-powered learning
                  </span>

                  <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {slide.headline}
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-100 sm:text-lg sm:leading-8">
                    {slide.description}
                  </p>

                  <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                    <Link
                      href={slide.primaryCta.href}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                    >
                      {slide.primaryCta.label}
                    </Link>

                    {slide.secondaryCta && (
                      <Link
                        href={slide.secondaryCta.href}
                        tabIndex={isActive ? 0 : -1}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/50 bg-black/20 px-6 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                      >
                        {slide.secondaryCta.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute inset-x-4 bottom-5 z-20 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 sm:hidden">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>

            <div
              className="flex items-center justify-center gap-2"
              aria-label="Choose a slide"
            >
              {slides.map((slide, index) => (
                <button
                  key={slide.headline}
                  type="button"
                  aria-label={`Go to slide ${index + 1}: ${slide.headline}`}
                  aria-current={index === current ? "true" : undefined}
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === current
                      ? "w-6 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight size={21} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>

          <div
            className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 sm:flex"
            aria-label="Choose a slide"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.headline}
                type="button"
                aria-label={`Go to slide ${index + 1}: ${slide.headline}`}
                aria-current={index === current ? "true" : undefined}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === current
                    ? "w-6 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
