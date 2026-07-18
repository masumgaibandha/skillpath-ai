"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      fetchClientApi<{ ok: true }>(`/courses/${courseId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
