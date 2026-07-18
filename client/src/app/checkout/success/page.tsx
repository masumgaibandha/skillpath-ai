"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchClientApi } from "@/lib/api";
import type { EnrollmentStatusResponse } from "@/lib/types";

const POLL_MS = 2000;
const TIMEOUT_MS = 16000;

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const slug = searchParams.get("slug");
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  // Trust the redirect only to know checkout finished, not that the
  // enrollment is active — that's only ever true once the Stripe webhook
  // has processed checkout.session.completed. Poll our own status
  // endpoint instead of reading anything off the redirect URL.
  const { data: status, isError, refetch } = useQuery({
    queryKey: ["enrollment-status", courseId],
    queryFn: () => fetchClientApi<EnrollmentStatusResponse>(`/enrollments/${courseId}/status`),
    enabled: Boolean(courseId),
    refetchInterval: (query) => {
      if (query.state.data?.enrolled || timedOut) return false;
      return POLL_MS;
    },
  });

  const courseHref = slug ? `/courses/${slug}` : "/explore";

  if (!courseId) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="text-indigo-600" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">Payment received</h1>
        <p className="mt-1 text-zinc-500">
          Check{" "}
          <Link href="/explore" className="text-indigo-600 hover:text-indigo-700">
            Explore
          </Link>{" "}
          for your course shortly.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <TriangleAlert className="text-zinc-400" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">Couldn&apos;t confirm enrollment</h1>
        <p className="mt-1 text-zinc-500">We couldn&apos;t reach the server to check your enrollment.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status?.enrolled) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="text-indigo-600" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">You&apos;re enrolled!</h1>
        <p className="mt-1 text-zinc-500">Your payment was successful and your enrollment is active.</p>
        <Link
          href={courseHref}
          className="mt-6 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go to course
        </Link>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <Clock className="text-amber-500" size={40} />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">Still processing</h1>
        <p className="mt-1 text-zinc-500">
          Your payment went through — activation is taking a little longer than usual. Refresh
          this page in a moment.
        </p>
        <Link
          href={courseHref}
          className="mt-6 rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">Confirming your payment…</h1>
      <p className="mt-1 text-zinc-500">This only takes a moment.</p>
    </div>
  );
}
