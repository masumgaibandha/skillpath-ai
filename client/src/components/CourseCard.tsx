import { Card, Chip, Skeleton } from "@heroui/react";
import { Clock, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/types";

const LEVEL_LABEL: Record<Course["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card.Root className="flex h-full flex-col gap-0 overflow-hidden p-0">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-zinc-100">
        <Image
          src={course.images[0]!}
          alt={course.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <Card.Content className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="soft" color="default">
            {LEVEL_LABEL[course.level]}
          </Chip>
          <span className="truncate text-xs text-zinc-500">{course.category}</span>
        </div>

        <Link href={`/courses/${course.slug}`} className="line-clamp-2 min-h-10 font-semibold text-zinc-900 hover:text-indigo-600">
          {course.title}
        </Link>

        <p className="line-clamp-2 flex-1 text-sm text-zinc-500">{course.shortDescription}</p>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {course.durationHours}h
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {course.rating.toFixed(1)}
            <span className="text-zinc-400">({course.ratingCount})</span>
          </span>
        </div>
      </Card.Content>

      <Card.Footer className="flex items-center justify-between border-t border-zinc-100 p-4">
        {course.isFree ? (
          <Chip size="sm" color="accent" variant="soft">
            Free
          </Chip>
        ) : (
          <span className="font-bold text-zinc-900">${course.price.toFixed(2)}</span>
        )}
        <Link
          href={`/courses/${course.slug}`}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          View Details
        </Link>
      </Card.Footer>
    </Card.Root>
  );
}

export function CourseCardSkeleton() {
  return (
    <Card.Root className="flex h-full flex-col gap-0 overflow-hidden p-0">
      <Skeleton className="aspect-video w-full" />
      <Card.Content className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Card.Content>
      <Card.Footer className="flex items-center justify-between border-t border-zinc-100 p-4">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </Card.Footer>
    </Card.Root>
  );
}
