"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { MyCoursesResponse } from "@/lib/types";

export function useMyCourses() {
  return useQuery({
    queryKey: ["my-courses"],
    queryFn: () => fetchClientApi<MyCoursesResponse>("/courses/mine"),
  });
}
