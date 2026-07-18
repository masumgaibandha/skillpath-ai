"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientApi, getErrorMessage } from "@/lib/api";
import type { ChatConversationResponse } from "@/lib/types";

interface SendMessageVariables {
  conversationId: string;
  content: string;
  // Required — see SendMessageInput. Generated once per send attempt by
  // the caller (crypto.randomUUID()) so retries/duplicates of the exact
  // same attempt can reuse it and get replayed server-side.
  clientMessageId: string;
}

// Takes the conversation id per-call (not as a hook argument) so the same
// mutation instance can be reused for both the main composer (id known at
// render time) and the "start with a suggested prompt" flow (id only
// known once the new conversation it belongs to has been created).
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, clientMessageId }: SendMessageVariables) =>
      fetchClientApi<ChatConversationResponse>(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, clientMessageId }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.setQueryData(["chat-conversation", variables.conversationId], data);
    },
    onError: (error) => {
      toast.danger(getErrorMessage(error, "Couldn't send that message."));
    },
  });
}
