"use client";

import { useMutation } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { CheckoutSessionResponse } from "@/lib/types";

export function useCheckoutSession() {
  return useMutation({
    mutationFn: (courseId: string) =>
      fetchClientApi<CheckoutSessionResponse>("/payments/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}
