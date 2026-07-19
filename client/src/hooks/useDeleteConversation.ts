"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      fetchClientApi<{ ok: true }>(`/chat/conversations/${conversationId}`, { method: "DELETE" }),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.removeQueries({ queryKey: ["chat-conversation", conversationId] });
      toast.success("Conversation deleted");
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't delete the conversation."));
    },
  });
}
