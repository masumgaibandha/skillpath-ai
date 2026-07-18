"use client";

import { Button } from "@heroui/react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Course } from "@/lib/types";
import { useCheckoutSession } from "@/hooks/useCheckoutSession";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";
import { useFreeEnroll } from "@/hooks/useFreeEnroll";

export function EnrollAction({ course }: { course: Course }) {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const isLoggedIn = !isSessionPending && Boolean(session?.user);

  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useEnrollmentStatus(course._id, isLoggedIn);

  const freeEnroll = useFreeEnroll(course._id);
  const checkout = useCheckoutSession();

  if (isSessionPending) {
    return <div className="h-11 w-full animate-pulse rounded-md bg-zinc-100" />;
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?redirectTo=/courses/${course.slug}`}
        className="block w-full rounded-md bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Log in to enroll
      </Link>
    );
  }

  if (isStatusLoading) {
    return <div className="h-11 w-full animate-pulse rounded-md bg-zinc-100" />;
  }

  if (isStatusError) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-700">
        <p className="flex items-center justify-center gap-1.5">
          <TriangleAlert size={14} /> Couldn&apos;t check enrollment status
        </p>
        <button
          type="button"
          onClick={() => refetchStatus()}
          className="mt-1 font-medium underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status?.enrolled) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700">
        <CheckCircle2 size={16} />
        You&apos;re enrolled
      </div>
    );
  }

  if (course.isFree) {
    return (
      <div>
        <Button
          variant="primary"
          fullWidth
          isDisabled={freeEnroll.isPending}
          onPress={() => freeEnroll.mutate()}
        >
          {freeEnroll.isPending ? "Enrolling…" : "Enroll for free"}
        </Button>
        {freeEnroll.isError && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-sm text-red-600">
            <TriangleAlert size={14} />
            {freeEnroll.error instanceof ApiError
              ? freeEnroll.error.message
              : "Something went wrong. Please try again."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="primary"
        fullWidth
        isDisabled={checkout.isPending}
        onPress={() => checkout.mutate(course._id)}
      >
        {checkout.isPending ? "Redirecting to checkout…" : `Buy course — $${course.price.toFixed(2)}`}
      </Button>
      {checkout.isError && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-sm text-red-600">
          <TriangleAlert size={14} />
          {checkout.error instanceof ApiError
            ? checkout.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}
    </div>
  );
}
