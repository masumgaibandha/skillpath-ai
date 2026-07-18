"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { EnrollmentStatusResponse } from "@/lib/types";

export function useEnrollmentStatus(courseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["enrollment-status", courseId],
    queryFn: () => fetchClientApi<EnrollmentStatusResponse>(`/enrollments/${courseId}/status`),
    enabled,
  });
}
