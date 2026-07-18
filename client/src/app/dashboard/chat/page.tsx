"use client";

import { Button, Chip, EmptyState, Modal, TextArea, useOverlayState } from "@heroui/react";
import {
  ArrowRight,
  Bot,
  Clock,
  FlaskConical,
  MessageSquare,
  MessageSquarePlus,
  Menu,
  Send,
  Sparkles,
  Trash2,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CourseImage } from "@/components/CourseImage";
import { useChatConfig } from "@/hooks/useChatConfig";
import { useChatConversation } from "@/hooks/useChatConversation";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { useDeleteConversation } from "@/hooks/useDeleteConversation";
import { useSendMessage } from "@/hooks/useSendMessage";
import { ApiError, getErrorMessage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { ChatConversationListItem, ChatMessage, CourseSummary } from "@/lib/types";

const STARTER_PROMPTS = [
  "What courses do you have on React?",
  "Recommend a free course for beginners",
  "What's a good course under $30?",
  "Compare Python for Data Analysis and Machine Learning with scikit-learn",
];

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isUnconfiguredError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}

function ChatCourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        <CourseImage src={course.images[0] ?? ""} alt={course.title} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-indigo-600">
          {course.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <Chip size="sm" variant="soft" color="default">
            {LEVEL_LABEL[course.level] ?? course.level}
          </Chip>
          <span className="truncate">{course.category}</span>
          <span className="font-medium text-zinc-700">
            {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
          View course
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`flex max-w-[85%] flex-col gap-2 sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isUser
              ? "rounded-tr-sm bg-indigo-600 text-white"
              : "rounded-tl-sm border border-zinc-200 bg-white text-zinc-800"
          }`}
        >
          {message.content}
        </div>
        <span className="px-1 text-xs text-zinc-400">{formatTime(message.createdAt)}</span>
        {message.referencedCourses.length > 0 && (
          <div className="flex w-full flex-col gap-2 sm:min-w-[320px]">
            {message.referencedCourses.map((c) => (
              <ChatCourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite" aria-label="Assistant is typing">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <Bot size={16} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  isSelected,
  onSelect,
  onDeleteRequest,
}: {
  conversation: ChatConversationListItem;
  isSelected: boolean;
  onSelect: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1 rounded-xl border p-2.5 transition ${
        isSelected ? "border-indigo-400 bg-indigo-50/60" : "border-zinc-200 bg-white hover:border-indigo-200"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected}
        className="min-w-0 flex-1 text-left"
      >
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{conversation.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
          <Clock size={11} />
          {formatDate(conversation.updatedAt)} · {conversation.messageCount} msg
          {conversation.messageCount === 1 ? "" : "s"}
        </p>
      </button>
      <button
        type="button"
        onClick={onDeleteRequest}
        aria-label={`Delete conversation "${conversation.title}"`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function ConversationList({
  conversations,
  isLoading,
  isError,
  onRetry,
  selectedId,
  onSelect,
  onDeleteRequest,
}: {
  conversations: ChatConversationListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleteRequest: (conversation: ChatConversationListItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-2">
        <div className="h-16 rounded-xl bg-zinc-100" />
        <div className="h-16 rounded-xl bg-zinc-100" />
        <div className="h-16 rounded-xl bg-zinc-100" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState className="rounded-xl border border-zinc-200 bg-white p-4">
        <TriangleAlert size={20} className="text-zinc-400" />
        <p className="mt-2 text-sm font-medium text-zinc-900">Couldn&apos;t load your conversations</p>
        <Button variant="outline" size="sm" className="mt-3" onPress={onRetry}>
          Try again
        </Button>
      </EmptyState>
    );
  }
  if (conversations.length === 0) {
    return (
      <EmptyState className="rounded-xl border border-dashed border-zinc-300 bg-white p-4">
        <MessageSquare size={20} className="text-zinc-300" />
        <p className="mt-2 text-sm text-zinc-500">No conversations yet — start a new one below.</p>
      </EmptyState>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {conversations.map((c) => (
        <li key={c._id}>
          <ConversationRow
            conversation={c}
            isSelected={selectedId === c._id}
            onSelect={() => onSelect(c._id)}
            onDeleteRequest={() => onDeleteRequest(c)}
          />
        </li>
      ))}
    </ul>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Extra guard on top of the parent's ref lock — blocks keyboard
      // auto-repeat or a rapid second Enter from even calling onSend()
      // while a request is already in flight.
      if (disabled) return;
      onSend();
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 sm:p-4">
      <TextArea
        aria-label="Message"
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about courses, topics, or what to learn next…"
        maxLength={2000}
        disabled={disabled}
        fullWidth
        className="max-h-40 min-h-[44px] resize-none"
      />
      <Button
        type="button"
        variant="primary"
        aria-label="Send message"
        isDisabled={disabled || value.trim().length === 0}
        onPress={onSend}
        className="shrink-0"
      >
        <Send size={16} />
      </Button>
    </div>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("c");
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login?redirectTo=/dashboard/chat");
    }
  }, [isSessionPending, session, router]);

  const conversations = useChatConversations();
  const config = useChatConfig();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();
  const deleteModal = useOverlayState();

  // null means "no explicit choice yet this session" — falls back to the
  // URL's ?c= (so a refresh or shared link lands back on the same
  // conversation) and finally to the most recently active one (derived
  // during render, not via a setState-in-effect), so returning learners
  // never see an empty panel. Explicit user actions (clicking a
  // conversation, starting a new one, deleting the current one) always
  // set manualConversationId, which then wins outright.
  const [manualConversationId, setManualConversationId] = useState<string | null>(null);
  const selectedConversationId =
    manualConversationId ?? urlConversationId ?? conversations.data?.items[0]?._id ?? null;

  // Keeps the URL in sync with explicit selections only — skips the very
  // first render so a URL-provided ?c= (deep link / refresh) isn't
  // immediately overwritten before the user has done anything.
  const skippedFirstSyncRef = useRef(false);
  useEffect(() => {
    if (!skippedFirstSyncRef.current) {
      skippedFirstSyncRef.current = true;
      return;
    }
    router.replace(manualConversationId ? `/dashboard/chat?c=${manualConversationId}` : "/dashboard/chat", {
      scroll: false,
    });
  }, [manualConversationId, router]);

  const [targetConversation, setTargetConversation] = useState<ChatConversationListItem | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const selectedConversation = useChatConversation(selectedConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    autoScrollRef.current = true;
  }, [selectedConversationId]);

  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversation.data, pendingUserMessage, sendMessage.isPending]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    autoScrollRef.current = distanceFromBottom < 96;
  }

  function selectConversation(id: string) {
    setManualConversationId(id);
    setMobileSidebarOpen(false);
  }

  function handleNewConversation() {
    if (isSubmittingRef.current) return;
    createConversation.mutate(undefined, {
      onSuccess: (data) => {
        setManualConversationId(data.conversation._id);
        setMobileSidebarOpen(false);
      },
    });
  }

  function sendInto(conversationId: string, text: string) {
    isSubmittingRef.current = true;
    setPendingUserMessage(text);
    sendMessage.mutate(
      { conversationId, content: text, clientMessageId: crypto.randomUUID() },
      {
        onSuccess: () => {
          setDraft("");
          setPendingUserMessage(null);
        },
        onError: () => setPendingUserMessage(null),
        onSettled: () => {
          isSubmittingRef.current = false;
        },
      }
    );
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || isSubmittingRef.current || sendMessage.isPending || !selectedConversationId) return;
    sendInto(selectedConversationId, text);
  }

  function handleStarterPrompt(text: string) {
    if (isSubmittingRef.current) return;
    if (selectedConversationId) {
      sendInto(selectedConversationId, text);
      return;
    }
    isSubmittingRef.current = true;
    createConversation.mutate(undefined, {
      onSuccess: (data) => {
        setManualConversationId(data.conversation._id);
        setPendingUserMessage(text);
        sendMessage.mutate(
          { conversationId: data.conversation._id, content: text, clientMessageId: crypto.randomUUID() },
          {
            onError: () => setPendingUserMessage(null),
            onSuccess: () => setPendingUserMessage(null),
            onSettled: () => {
              isSubmittingRef.current = false;
            },
          }
        );
      },
      onError: () => {
        isSubmittingRef.current = false;
      },
    });
  }

  function requestDelete(conversation: ChatConversationListItem) {
    deleteConversation.reset();
    setTargetConversation(conversation);
    deleteModal.open();
  }

  function confirmDelete() {
    if (!targetConversation) return;
    deleteConversation.mutate(targetConversation._id, {
      onSuccess: () => {
        if (selectedConversationId === targetConversation._id) {
          setManualConversationId(null);
        }
        deleteModal.close();
      },
    });
  }

  if (isSessionPending || !session?.user) {
    return null;
  }

  const items = conversations.data?.items ?? [];
  const messages = selectedConversation.data?.conversation.messages ?? [];
  const isPending = sendMessage.isPending;

  const sidebarContent = (
    <>
      <Button variant="primary" fullWidth onPress={handleNewConversation} isDisabled={createConversation.isPending}>
        <MessageSquarePlus size={16} className="mr-1.5" />
        {createConversation.isPending ? "Starting…" : "New conversation"}
      </Button>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <ConversationList
          conversations={items}
          isLoading={conversations.isLoading}
          isError={conversations.isError}
          onRetry={() => conversations.refetch()}
          selectedId={selectedConversationId}
          onSelect={selectConversation}
          onDeleteRequest={requestDelete}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-zinc-50">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open conversation list"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="flex items-center gap-2 text-lg font-bold text-zinc-900 sm:text-xl">
            <Sparkles className="text-indigo-600" size={22} />
            AI Course Assistant
          </h1>
        </div>
        {config.data?.demoMode && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 sm:text-sm">
            <FlaskConical size={14} />
            Demo AI Mode
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden min-h-0 w-80 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 lg:flex">
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <button
              type="button"
              aria-label="Close conversation list"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-zinc-900/40"
            />
            <div className="relative flex h-full min-h-0 w-80 max-w-[85vw] flex-col bg-white p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">Conversations</h2>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close conversation list"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main chat panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!selectedConversationId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6 text-center">
              <div>
                <Sparkles size={32} className="mx-auto text-indigo-300" />
                <p className="mt-3 text-lg font-semibold text-zinc-900">
                  Ask about any course in the catalog
                </p>
                <p className="mt-1 max-w-sm text-sm text-zinc-500">
                  I can search real courses by topic, level, or budget, compare two courses, or suggest what to
                  take next.
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleStarterPrompt(prompt)}
                    className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-sm text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-6">
               <div className="mx-auto w-full max-w-3xl">
                {selectedConversation.isLoading ? (
                  <div className="flex animate-pulse flex-col gap-4">
                    <div className="h-16 w-2/3 rounded-2xl bg-zinc-100" />
                    <div className="ml-auto h-12 w-1/2 rounded-2xl bg-zinc-100" />
                  </div>
                ) : selectedConversation.isError ? (
                  <EmptyState className="rounded-2xl border border-zinc-200 bg-white p-8">
                    <TriangleAlert size={28} className="text-zinc-400" />
                    <p className="mt-3 font-medium text-zinc-900">Couldn&apos;t load this conversation</p>
                    <Button variant="outline" size="sm" className="mt-4" onPress={() => selectedConversation.refetch()}>
                      Try again
                    </Button>
                  </EmptyState>
                ) : (
                  <div className="flex flex-col gap-5">
                    {messages.length === 0 && !pendingUserMessage && (
                      <p className="py-8 text-center text-sm text-zinc-400">
                        Send a message to start this conversation.
                      </p>
                    )}
                    {messages.map((m, i) => (
                      <MessageBubble key={`${m.createdAt}-${i}`} message={m} />
                    ))}
                    {pendingUserMessage && (
                      <MessageBubble
                        message={{
                          role: "user",
                          content: pendingUserMessage,
                          referencedCourses: [],
                          createdAt: new Date().toISOString(),
                        }}
                      />
                    )}
                    {isPending && <TypingIndicator />}
                  </div>
                )}
               </div>
              </div>

              {sendMessage.isError && (
                <div role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  <div className="mx-auto w-full max-w-3xl">
                    {isUnconfiguredError(sendMessage.error)
                      ? "The AI Chat Assistant isn't configured yet — ask an admin to set OPENAI_API_KEY."
                      : getErrorMessage(sendMessage.error, "Couldn't get a reply. Your message is still in the box — try sending it again.")}
                  </div>
                </div>
              )}

              <div className="border-t border-zinc-200 bg-white">
                <div className="mx-auto w-full max-w-3xl">
                  <Composer value={draft} onChange={setDraft} onSend={handleSend} disabled={isPending} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal.Root state={deleteModal}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Delete conversation?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {targetConversation && (
                  <p className="truncate text-sm font-medium text-zinc-900">{targetConversation.title}</p>
                )}
                <p className="mt-2 text-sm text-zinc-600">
                  This will permanently delete this conversation and its messages. This can&apos;t be undone.
                </p>
                {deleteConversation.isError && (
                  <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <TriangleAlert size={16} />
                    {getErrorMessage(deleteConversation.error, "Something went wrong deleting this conversation.")}
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => deleteModal.close()}>
                  Cancel
                </Button>
                <Button variant="danger" isDisabled={deleteConversation.isPending} onPress={confirmDelete}>
                  {deleteConversation.isPending ? "Deleting…" : "Delete conversation"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
