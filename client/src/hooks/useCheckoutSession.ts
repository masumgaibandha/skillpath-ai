"use client";

import { toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
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
      // Navigates away immediately — no success toast, there's nothing left
      // to see it.
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't start checkout."));
    },
  });
}
