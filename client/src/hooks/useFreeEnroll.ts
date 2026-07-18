"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
import type { Enrollment } from "@/lib/types";

export function useFreeEnroll(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchClientApi<{ enrollment: Enrollment }>(`/enrollments/free/${courseId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-status", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast.success("You're enrolled!");
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't enroll in this course."));
    },
  });
}
