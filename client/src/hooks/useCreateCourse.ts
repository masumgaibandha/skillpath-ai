"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(`"${data.course.title}" was created`);
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't create the course."));
    },
  });
}
