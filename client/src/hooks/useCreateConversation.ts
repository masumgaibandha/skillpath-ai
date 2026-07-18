"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
import type { ChatConversationResponse } from "@/lib/types";

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchClientApi<ChatConversationResponse>("/chat/conversations", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.setQueryData(["chat-conversation", data.conversation._id], data);
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't start a new conversation."));
    },
  });
}
