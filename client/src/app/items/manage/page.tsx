"use client";

import { Button, Chip, EmptyState, Modal, useOverlayState } from "@heroui/react";
import { BookOpen, Eye, PlusCircle, Trash2, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import { useDeleteCourse } from "@/hooks/useDeleteCourse";
import { useMyCourses } from "@/hooks/useMyCourses";

const LEVEL_LABEL: Record<Course["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusChip({ status }: { status: Course["status"] }) {
  return (
    <Chip size="sm" variant="soft" color={status === "published" ? "accent" : "default"}>
      {status === "published" ? "Published" : "Draft"}
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
        <div className="h-5 w-16 rounded-full bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-zinc-100" />
      </td>
      <td className="px-4 py-3">
        <div className="ml-auto h-8 w-20 rounded-md bg-zinc-100" />
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
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-md bg-zinc-100" />
        <div className="h-9 flex-1 rounded-md bg-zinc-100" />
      </div>
    </div>
  );
}

export default function ManageCoursesPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login?redirectTo=/items/manage");
    }
  }, [isSessionPending, session, router]);

  const { data, isLoading, isError, refetch } = useMyCourses();
  const deleteCourse = useDeleteCourse();
  const deleteModal = useOverlayState();
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);

  function requestDelete(course: Course) {
    deleteCourse.reset();
    setTargetCourse(course);
    deleteModal.open();
  }

  function confirmDelete() {
    if (!targetCourse) return;
    deleteCourse.mutate(targetCourse._id, {
      onSuccess: () => deleteModal.close(),
    });
  }

  if (isSessionPending || !session?.user) {
    return null;
  }

  const count = data?.items.length ?? 0;

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">My courses</h1>
            <p className="mt-1 text-zinc-500">
              {isLoading
                ? "Courses you've added to the catalog."
                : `${count} ${count === 1 ? "course" : "courses"} you've added to the catalog.`}
            </p>
          </div>
          <Link
            href="/items/add"
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <PlusCircle size={16} />
            Add course
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
          ) : data && data.items.length > 0 ? (
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
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data.items.map((course) => (
                      <tr key={course._id} className="transition-colors hover:bg-zinc-50/70">
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
                          <StatusChip status={course.status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{formatDate(course.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/courses/${course.slug}`}
                              aria-label={`View ${course.title}`}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              type="button"
                              aria-label={`Delete ${course.title}`}
                              onClick={() => requestDelete(course)}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
                {data.items.map((course) => (
                  <div
                    key={course._id}
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
                        <StatusChip status={course.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-1 font-semibold text-zinc-900">
                        {course.title}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {course.category} · {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Created {formatDate(course.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                      <Button
                        variant="danger-soft"
                        size="sm"
                        className="flex-1"
                        onPress={() => requestDelete(course)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState className="rounded-2xl border border-zinc-200 bg-white">
              <BookOpen size={32} className="text-zinc-400" />
              <p className="mt-3 font-medium text-zinc-900">You haven&apos;t added any courses yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Create your first course to see it listed here.
              </p>
              <Link
                href="/items/add"
                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add a course
              </Link>
            </EmptyState>
          )}
        </div>

        <Modal.Root state={deleteModal}>
          <Modal.Backdrop>
            <Modal.Container size="sm">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Delete course?</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  {targetCourse && (
                    <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-200">
                        <Image
                          src={targetCourse.images[0]!}
                          alt={targetCourse.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {targetCourse.title}
                      </p>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-zinc-600">
                    This will permanently remove this course from the catalog. This can&apos;t be
                    undone.
                  </p>
                  {deleteCourse.isError && (
                    <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                      <TriangleAlert size={16} />
                      {deleteCourse.error instanceof ApiError
                        ? deleteCourse.error.message
                        : "Something went wrong deleting this course."}
                    </p>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline" onPress={() => deleteModal.close()}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    isDisabled={deleteCourse.isPending}
                    onPress={confirmDelete}
                  >
                    {deleteCourse.isPending ? "Deleting…" : "Delete course"}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      </div>
    </div>
  );
}
