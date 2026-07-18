"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { Course, CreateCourseInput } from "@/lib/types";

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      fetchClientApi<{ course: Course }>("/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
