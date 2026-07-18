import { Compass, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — SkillPath AI",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="text-sm font-semibold tracking-widest text-indigo-600">404</span>
      <h1 className="mt-3 text-3xl font-bold text-zinc-900 sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
        back on track.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Home size={16} />
          Back to Home
        </Link>
        <Link
          href="/explore"
          className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          <Compass size={16} />
          Explore courses
        </Link>
      </div>
    </div>
  );
}
