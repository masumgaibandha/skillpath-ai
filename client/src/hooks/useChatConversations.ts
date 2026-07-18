"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { ChatConversationsListResponse } from "@/lib/types";

export function useChatConversations() {
  return useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => fetchClientApi<ChatConversationsListResponse>("/chat/conversations"),
  });
}
