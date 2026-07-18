import type { NextConfig } from "next";

// Express API base URL. In dev this is the local Express server; in
// production it should point at the deployed API (Render/Railway).
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
