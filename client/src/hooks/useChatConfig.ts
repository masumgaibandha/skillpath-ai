"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { ChatConfigResponse } from "@/lib/types";

export function useChatConfig() {
  return useQuery({
    queryKey: ["chat-config"],
    queryFn: () => fetchClientApi<ChatConfigResponse>("/chat/config"),
    staleTime: Infinity,
  });
}
