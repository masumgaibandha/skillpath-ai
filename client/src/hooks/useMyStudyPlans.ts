"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { MyStudyPlansResponse } from "@/lib/types";

export function useMyStudyPlans() {
  return useQuery({
    queryKey: ["my-study-plans"],
    queryFn: () => fetchClientApi<MyStudyPlansResponse>("/study-plan/me"),
  });
}
