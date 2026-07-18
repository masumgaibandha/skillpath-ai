import type { NextConfig } from "next";

// Express API base URL. In dev this is the local Express server; in
// production it should point at the deployed API (the server/ Vercel
// project's own deployment URL). Server-side only — no NEXT_PUBLIC_
// prefix — so it's never bundled into the browser; the browser only ever
// talks to this Next.js origin via the /api/* rewrite below.
const API_URL = process.env.API_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // No remotePatterns: every next/image usage in this app is a local
  // static asset (StaticImageData imports — BrandLogo, HeroCarousel, the
  // landing/about page images). Course images are user-submitted URLs of
  // arbitrary, unpredictable hosts, so they're deliberately never passed
  // to next/image (which requires a fixed remote-host allowlist) — see
  // components/CourseImage.tsx, which renders them as a validated plain
  // <img> with a broken-image fallback instead.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
