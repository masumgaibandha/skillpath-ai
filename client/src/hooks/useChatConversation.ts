"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientApi } from "@/lib/api";
import type { ChatConversationResponse } from "@/lib/types";

export function useChatConversation(id: string | null) {
  return useQuery({
    queryKey: ["chat-conversation", id],
    queryFn: () => fetchClientApi<ChatConversationResponse>(`/chat/conversations/${id}`),
    enabled: Boolean(id),
  });
}
