import type { NextConfig } from "next";

// Express API base URL. In dev this is the local Express server; in
// production it should point at the deployed API (the server/ Vercel
// project's own deployment URL). Server-side only — no NEXT_PUBLIC_
// prefix — so it's never bundled into the browser; the browser only ever
// talks to this Next.js origin via the /api/* rewrite below.
const API_URL = process.env.API_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
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
