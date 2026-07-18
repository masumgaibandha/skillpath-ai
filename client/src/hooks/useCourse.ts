"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { CourseDetailResponse } from "@/lib/types";

export function useCourse(slug: string, initialData?: CourseDetailResponse) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchClientApi<CourseDetailResponse>(`/courses/${slug}`),
    initialData,
  });
}
