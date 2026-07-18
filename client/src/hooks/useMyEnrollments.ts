"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { MyEnrollmentsResponse } from "@/lib/types";

export function useMyEnrollments() {
  return useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => fetchClientApi<MyEnrollmentsResponse>("/enrollments/me"),
  });
}
