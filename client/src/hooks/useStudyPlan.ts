"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { StudyPlanResponse } from "@/lib/types";

export function useStudyPlan(id: string | null) {
  return useQuery({
    queryKey: ["study-plan", id],
    queryFn: () => fetchClientApi<StudyPlanResponse>(`/study-plan/${id}`),
    enabled: Boolean(id),
  });
}
