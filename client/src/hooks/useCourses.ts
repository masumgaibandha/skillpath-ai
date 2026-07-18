"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import { buildCourseQueryString } from "@/lib/courseQueryString";
import type { CourseListResponse, CourseQueryParams } from "@/lib/types";

export function useCourses(params: CourseQueryParams, initialData?: CourseListResponse) {
  const queryString = buildCourseQueryString(params);
  return useQuery({
    queryKey: ["courses", queryString],
    queryFn: () => fetchClientApi<CourseListResponse>(`/courses?${queryString}`),
    initialData,
  });
}
