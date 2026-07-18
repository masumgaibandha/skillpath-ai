import { CourseCardSkeleton } from "@/components/CourseCard";

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-9 w-64 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded-md bg-zinc-100" />
      <div className="mt-6 h-16 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
