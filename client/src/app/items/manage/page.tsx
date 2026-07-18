"use client";

import { Button, Chip, EmptyState, Modal, useOverlayState } from "@heroui/react";
import { BookOpen, PlusCircle, TriangleAlert } from "lucide-react";
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

function CourseRowSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="h-24 w-full shrink-0 rounded-lg bg-zinc-100 sm:h-20 sm:w-32" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 rounded-full bg-zinc-100" />
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
        <div className="h-3 w-1/3 rounded bg-zinc-100" />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="h-9 w-20 rounded-md bg-zinc-100" />
        <div className="h-9 w-20 rounded-md bg-zinc-100" />
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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
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

      <div className="mt-8 flex flex-col gap-4">
        {isError ? (
          <EmptyState>
            <TriangleAlert size={32} className="text-zinc-400" />
            <p className="mt-3 font-medium text-zinc-900">Couldn&apos;t load your courses</p>
            <p className="mt-1 text-sm text-zinc-500">Something went wrong reaching the server.</p>
            <Button variant="outline" size="sm" className="mt-4" onPress={() => refetch()}>
              Try again
            </Button>
          </EmptyState>
        ) : isLoading ? (
          <>
            <CourseRowSkeleton />
            <CourseRowSkeleton />
            <CourseRowSkeleton />
          </>
        ) : data && data.items.length > 0 ? (
          data.items.map((course) => (
            <div
              key={course._id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-20 sm:w-32">
                <Image
                  src={course.images[0]!}
                  alt={course.title}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="soft" color="default">
                    {LEVEL_LABEL[course.level]}
                  </Chip>
                  <span className="truncate text-xs text-zinc-500">{course.category}</span>
                </div>
                <p className="mt-1.5 truncate font-semibold text-zinc-900">{course.title}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {course.isFree ? "Free" : `$${course.price.toFixed(2)}`} ·{" "}
                  {course.durationHours}h
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/courses/${course.slug}`}
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-none"
                >
                  View
                </Link>
                <Button
                  variant="danger-soft"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onPress={() => requestDelete(course)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState>
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
  );
}
