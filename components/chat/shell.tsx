"use client";

import { useEffect, useRef, useState } from "react";
import { useChatCabinets } from "@/components/chat/chat-cabinets-context";
import { useChatDocPreviewVisible } from "@/components/chat/chat-doc-preview-context";
import { DocPreviewPanel } from "@/components/chat/doc-preview-panel";
import { SourcesCabinet } from "@/components/chat/sources-cabinet";
import { ChatTour } from "@/components/onboarding/chat-tour";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  initialArtifactData,
  useArtifact,
  useArtifactSelector,
} from "@/hooks/use-artifact";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Artifact } from "./artifact";
import { ChatHeader } from "./chat-header";
import { DataStreamHandler } from "./data-stream-handler";
import { submitEditedMessage } from "./message-editor";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function ChatShell() {
  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    visibilityType,
    isReadonly,
    isLoading,
    votes,
    currentModelId,
    setCurrentModelId,
    showCreditCardAlert,
    setShowCreditCardAlert,
  } = useActiveChat();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();
  const {
    open: cabinetsOpen,
    setOpen: setCabinetsOpen,
    setWebSources,
  } = useChatCabinets();
  // One right-rail panel at a time (desktop). Doc preview yields to Sources.
  const showDocPreview =
    useChatDocPreviewVisible() && !isArtifactVisible && !cabinetsOpen;
  const desktopSideOpen = showDocPreview || cabinetsOpen;

  const stopRef = useRef(stop);
  stopRef.current = stop;

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      setArtifact(initialArtifactData);
      setEditingMessage(null);
      setAttachments([]);
      setCabinetsOpen(false);
    }
  }, [chatId, setArtifact, setCabinetsOpen]);

  useEffect(() => {
    const sources: { title: string; url: string; snippet?: string }[] = [];
    const seen = new Set<string>();
    for (const message of messages) {
      for (const part of message.parts ?? []) {
        if (part.type !== "tool-webSearch") {
          continue;
        }
        const output = "output" in part ? part.output : undefined;
        if (!(output && typeof output === "object" && "results" in output)) {
          continue;
        }
        const results = (output as { results?: unknown }).results;
        if (!Array.isArray(results)) {
          continue;
        }
        for (const row of results) {
          if (!(row && typeof row === "object")) {
            continue;
          }
          const r = row as { title?: string; url?: string; snippet?: string };
          if (typeof r.url !== "string" || seen.has(r.url)) {
            continue;
          }
          seen.add(r.url);
          sources.push({
            title: typeof r.title === "string" ? r.title : r.url,
            url: r.url,
            snippet: typeof r.snippet === "string" ? r.snippet : undefined,
          });
        }
      }
    }
    setWebSources(sources);
  }, [messages, setWebSources]);

  return (
    <>
      <div className="relative flex h-dvh w-full overflow-hidden md:flex-row">
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isArtifactVisible
              ? "w-full md:w-[40%]"
              : desktopSideOpen
                ? "w-full md:w-[58%]"
                : "w-full"
          )}
        >
          <ChatHeader
            chatId={chatId}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
            <Messages
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isArtifactVisible={isArtifactVisible}
              isLoading={isLoading}
              isReadonly={isReadonly}
              messages={messages}
              onEditMessage={(msg) => {
                const text = msg.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("");
                setInput(text ?? "");
                setEditingMessage(msg);
              }}
              regenerate={regenerate}
              selectedModelId={currentModelId}
              setMessages={setMessages}
              status={status}
              votes={votes}
            />

            <div
              className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4"
              data-tour="chat-input"
            >
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  chatId={chatId}
                  editingMessage={editingMessage}
                  input={input}
                  isLoading={isLoading}
                  messages={messages}
                  onCancelEdit={() => {
                    setEditingMessage(null);
                    setInput("");
                  }}
                  onModelChange={setCurrentModelId}
                  selectedModelId={currentModelId}
                  selectedVisibilityType={visibilityType}
                  sendMessage={
                    editingMessage
                      ? async () => {
                          const msg = editingMessage;
                          setEditingMessage(null);
                          await submitEditedMessage({
                            message: msg,
                            text: input,
                            setMessages,
                            regenerate,
                          });
                          setInput("");
                        }
                      : sendMessage
                  }
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                />
              )}
            </div>
          </div>
        </div>

        {showDocPreview ? (
          <DocPreviewPanel
            className={cn(
              "fixed inset-0 z-40 flex flex-col",
              "md:static md:inset-auto md:z-auto md:h-auto md:w-[36%] md:min-w-[280px] md:max-w-[440px]"
            )}
          />
        ) : null}

        <SourcesCabinet chatId={chatId} />

        <Artifact
          addToolApprovalResponse={addToolApprovalResponse}
          attachments={attachments}
          chatId={chatId}
          input={input}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          selectedVisibilityType={visibilityType}
          sendMessage={sendMessage}
          setAttachments={setAttachments}
          setInput={setInput}
          setMessages={setMessages}
          status={status}
          stop={stop}
          votes={votes}
        />
      </div>

      <DataStreamHandler />
      <ChatTour />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configure Gemini API</AlertDialogTitle>
            <AlertDialogDescription>
              Set GEMINI_API_KEY in your environment to enable AI features
              powered by Gemini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
              }}
            >
              Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
