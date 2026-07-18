"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
import type { CreateStudyPlanInput, StudyPlanResponse } from "@/lib/types";

export function useCreateStudyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudyPlanInput) =>
      fetchClientApi<StudyPlanResponse>("/study-plan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-study-plans"] });
      queryClient.setQueryData(["study-plan", data.studyPlan._id], data);
      toast.success(`"${data.studyPlan.title}" is ready`);
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't generate a study plan."));
    },
  });
}
