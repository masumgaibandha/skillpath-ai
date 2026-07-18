"use client";

import { Button, Chip, EmptyState } from "@heroui/react";
import { Compass, Eye, GraduationCap, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMyEnrollments } from "@/hooks/useMyEnrollments";
import { authClient } from "@/lib/auth-client";
import type { Course, Enrollment } from "@/lib/types";

const LEVEL_LABEL: Record<Course["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function getCourse(enrollment: Enrollment): Course | null {
  return typeof enrollment.courseId === "object" ? enrollment.courseId : null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TypeChip({ type }: { type: Enrollment["type"] }) {
  return (
    <Chip size="sm" variant="soft" color={type === "free" ? "accent" : "default"}>
      {type === "free" ? "Free" : "Paid"}
    </Chip>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-zinc-100 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-14 shrink-0 rounded-md bg-zinc-100" />
          <div className="h-4 w-40 rounded bg-zinc-100" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-12 rounded bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-14 rounded-full bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="ml-auto h-8 w-16 rounded-md bg-zinc-100" />
      </td>
    </tr>
  );
}

function CardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-32 w-full rounded-lg bg-zinc-100" />
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-full bg-zinc-100" />
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
        <div className="h-3 w-1/3 rounded bg-zinc-100" />
      </div>
      <div className="h-9 w-full rounded-md bg-zinc-100" />
    </div>
  );
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login?redirectTo=/dashboard/courses");
    }
  }, [isSessionPending, session, router]);

  const { data, isLoading, isError, refetch } = useMyEnrollments();

  if (isSessionPending || !session?.user) {
    return null;
  }

  const enrollments = (data?.items ?? []).filter((e) => getCourse(e) !== null);
  const count = enrollments.length;

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">My courses</h1>
            <p className="mt-1 text-zinc-500">
              {isLoading
                ? "Courses you're enrolled in."
                : `${count} ${count === 1 ? "course" : "courses"} you're enrolled in.`}
            </p>
          </div>
          <Link
            href="/explore"
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Compass size={16} />
            Explore courses
          </Link>
        </div>

        <div className="mt-8">
          {isError ? (
            <EmptyState className="rounded-2xl border border-zinc-200 bg-white">
              <TriangleAlert size={32} className="text-zinc-400" />
              <p className="mt-3 font-medium text-zinc-900">Couldn&apos;t load your courses</p>
              <p className="mt-1 text-sm text-zinc-500">Something went wrong reaching the server.</p>
              <Button variant="outline" size="sm" className="mt-4" onPress={() => refetch()}>
                Try again
              </Button>
            </EmptyState>
          ) : isLoading ? (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <tbody>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </>
          ) : enrollments.length > 0 ? (
            <>
              {/* Desktop/tablet: data table */}
              <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Course</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Level</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Enrolled</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {enrollments.map((enrollment) => {
                      const course = getCourse(enrollment)!;
                      return (
                        <tr key={enrollment._id} className="transition-colors hover:bg-zinc-50/70">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                                <Image
                                  src={course.images[0]!}
                                  alt={course.title}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                              <span className="line-clamp-1 max-w-56 font-medium text-zinc-900">
                                {course.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{course.category}</td>
                          <td className="px-4 py-3">
                            <Chip size="sm" variant="soft" color="default">
                              {LEVEL_LABEL[course.level]}
                            </Chip>
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3">
                            <TypeChip type={enrollment.type} />
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {formatDate(enrollment.enrolledAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <Link
                                href={`/courses/${course.slug}`}
                                aria-label={`View ${course.title}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                              >
                                <Eye size={14} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
                {enrollments.map((enrollment) => {
                  const course = getCourse(enrollment)!;
                  return (
                    <div
                      key={enrollment._id}
                      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100">
                        <Image
                          src={course.images[0]!}
                          alt={course.title}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Chip size="sm" variant="soft" color="default">
                            {LEVEL_LABEL[course.level]}
                          </Chip>
                          <TypeChip type={enrollment.type} />
                        </div>
                        <p className="mt-1.5 line-clamp-1 font-semibold text-zinc-900">
                          {course.title}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500">
                          {course.category} · {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Enrolled {formatDate(enrollment.enrolledAt)}
                        </p>
                      </div>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <Eye size={14} />
                        View course
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState className="rounded-2xl border border-zinc-200 bg-white">
              <GraduationCap size={32} className="text-zinc-400" />
              <p className="mt-3 font-medium text-zinc-900">You haven&apos;t enrolled in any courses yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Browse the catalog and enroll to see your courses here.
              </p>
              <Link
                href="/explore"
                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Explore courses
              </Link>
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
