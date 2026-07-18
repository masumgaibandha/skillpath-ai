"use client";

import { Button, EmptyState, Input } from "@heroui/react";
import { Search, SearchX, TriangleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CourseCard, CourseCardSkeleton } from "@/components/CourseCard";
import { useCourses } from "@/hooks/useCourses";
import { COURSE_CATEGORIES, SORT_LABELS } from "@/lib/constants";
import { buildCourseQueryString } from "@/lib/courseQueryString";
import { COURSE_LEVELS, COURSE_SORTS } from "@/lib/types";
import type { CourseListResponse, CourseQueryParams, CourseSort } from "@/lib/types";

const PAGE_SIZE = 12;

function paramsFromSearchParams(sp: URLSearchParams): CourseQueryParams {
  const params: CourseQueryParams = {
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: PAGE_SIZE,
    sort: (sp.get("sort") as CourseSort) || "newest",
  };
  if (sp.get("search")) params.search = sp.get("search")!;
  if (sp.get("category")) params.category = sp.get("category")!;
  if (sp.get("level")) params.level = sp.get("level") as CourseQueryParams["level"];
  if (sp.get("minPrice")) params.minPrice = Number(sp.get("minPrice"));
  if (sp.get("maxPrice")) params.maxPrice = Number(sp.get("maxPrice"));
  if (sp.get("isFree")) params.isFree = sp.get("isFree") === "true";
  return params;
}

export function ExploreClient({
  initialParams,
  initialData,
}: {
  initialParams: CourseQueryParams;
  initialData: CourseListResponse;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const initialQueryString = useMemo(() => buildCourseQueryString(initialParams), [initialParams]);

  const [params, setParams] = useState<CourseQueryParams>(initialParams);
  const [searchInput, setSearchInput] = useState(initialParams.search ?? "");

  const queryString = buildCourseQueryString(params);
  const { data, isLoading, isFetching, isError, refetch } = useCourses(
    params,
    queryString === initialQueryString ? initialData : undefined
  );

  // Keep the URL shareable/bookmarkable without re-invoking the Server
  // Component's own fetch on every keystroke — this component owns
  // fetching from here on, per the Server-fetch-once rule.
  useEffect(() => {
    router.replace(`${pathname}?${queryString}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  // Debounce the free-text search box into `params`.
  useEffect(() => {
    const handle = setTimeout(() => {
      setParams((prev) => {
        const next = { ...prev, page: 1, search: searchInput || undefined };
        return next;
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function updateParam<K extends keyof CourseQueryParams>(key: K, value: CourseQueryParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function clearFilters() {
    setSearchInput("");
    setParams({ page: 1, limit: PAGE_SIZE, sort: "newest" });
  }

  const hasActiveFilters = Boolean(
    params.search || params.category || params.level || params.isFree || params.minPrice || params.maxPrice
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">Explore courses</h1>
      <p className="mt-1 text-zinc-500">
        Search and filter {data?.total ?? initialData.total} courses across every category.
      </p>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses..."
            fullWidth
            className="pl-9"
            aria-label="Search courses"
          />
        </div>

        <select
          value={params.category ?? ""}
          onChange={(e) => updateParam("category", e.target.value || undefined)}
          aria-label="Category"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All categories</option>
          {COURSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={params.level ?? ""}
          onChange={(e) =>
            updateParam("level", (e.target.value || undefined) as CourseQueryParams["level"])
          }
          aria-label="Level"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All levels</option>
          {COURSE_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l[0]!.toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={params.isFree === true}
            onChange={(e) => updateParam("isFree", e.target.checked ? true : undefined)}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
          />
          Free only
        </label>

        <select
          value={params.sort}
          onChange={(e) => updateParam("sort", e.target.value as CourseSort)}
          aria-label="Sort by"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 sm:ml-auto"
        >
          {COURSE_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onPress={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <EmptyState className="mt-10">
          <TriangleAlert size={32} className="text-zinc-400" />
          <p className="mt-3 font-medium text-zinc-900">Couldn&apos;t load courses</p>
          <p className="mt-1 text-sm text-zinc-500">Something went wrong reaching the server.</p>
          <Button variant="outline" size="sm" className="mt-4" onPress={() => refetch()}>
            Try again
          </Button>
        </EmptyState>
      ) : isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div
            className={`mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${isFetching ? "opacity-60" : ""}`}
          >
            {data.items.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              isDisabled={params.page === 1}
              onPress={() => setParams((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm text-zinc-500">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              isDisabled={data.page >= data.totalPages}
              onPress={() => setParams((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <EmptyState className="mt-10">
          <SearchX size={32} className="text-zinc-400" />
          <p className="mt-3 font-medium text-zinc-900">No courses match your filters</p>
          <p className="mt-1 text-sm text-zinc-500">Try adjusting or clearing your filters.</p>
          <Button variant="outline" size="sm" className="mt-4" onPress={clearFilters}>
            Clear filters
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
