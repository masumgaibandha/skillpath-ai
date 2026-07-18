"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const courseHref = slug ? `/courses/${slug}` : "/explore";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <XCircle className="text-zinc-400" size={40} />
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">Checkout canceled</h1>
      <p className="mt-1 text-zinc-500">
        No payment was made and you haven&apos;t been enrolled. You can pick up where you left
        off any time.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={courseHref}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to course
        </Link>
        <Link
          href="/explore"
          className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Explore courses
        </Link>
      </div>
    </div>
  );
}
