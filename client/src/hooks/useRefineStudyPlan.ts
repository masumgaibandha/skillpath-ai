"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
import type { RefineStudyPlanInput, StudyPlanResponse } from "@/lib/types";

export function useRefineStudyPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RefineStudyPlanInput) =>
      fetchClientApi<StudyPlanResponse>(`/study-plan/${id}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-study-plans"] });
      queryClient.setQueryData(["study-plan", id], data);
      toast.success(`Plan refined to version ${data.studyPlan.version}`);
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't refine the study plan."));
    },
  });
}
