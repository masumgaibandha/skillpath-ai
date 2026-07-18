"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { StudyPlanConfigResponse } from "@/lib/types";

export function useStudyPlanConfig() {
  return useQuery({
    queryKey: ["study-plan-config"],
    queryFn: () => fetchClientApi<StudyPlanConfigResponse>("/study-plan/config"),
    staleTime: Infinity,
  });
}
