"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  BrainIcon,
  EyeIcon,
  LockIcon,
  Plug,
  WrenchIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { useChatDocPreview } from "@/components/chat/chat-doc-preview-context";
import { useChatMcp } from "@/components/chat/chat-mcp-context";
import { Docs4LlmModeToggle } from "@/components/docs4llm/mode-toggle";
import { UrlDetectBanner } from "@/components/docs4llm/url-detect-banner";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { guestRegex } from "@/lib/constants";
import { detectDocs4LlmIntent, extractDocsUrl } from "@/lib/docs4llm/detect-url";
import { useSupabaseAuth } from "@/lib/supabase/auth";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { PaperclipIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

const GUEST_QUERY_LIMIT = 5;

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  editingMessage,
  onCancelEdit,
  isLoading,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage:
    | UseChatHelpers<ChatMessage>["sendMessage"]
    | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );
  const [persistedDocs4llmMode, setPersistedDocs4llmMode] = useLocalStorage(
    "docs4llm-mode",
    false
  );
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const docs4llmMode = hasMounted ? persistedDocs4llmMode : false;
  const setDocs4llmMode = setPersistedDocs4llmMode;

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setInput(urlParam);
      setDocs4llmMode(true);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams, setInput, setDocs4llmMode]);
  const [docs4llmLoading, setDocs4llmLoading] = useState(false);
  const { user } = useSupabaseAuth();
  // Anonymous Supabase users have no email on the client, so the synthesized
  // `guest-…` address only exists server-side. Detect the anonymous flag too,
  // otherwise guests are mis-read as regular users and skip the chat-only /
  // 5-query guardrails (and would be allowed to attempt MCP generation).
  const isGuest =
    !user || user.is_anonymous === true || guestRegex.test(user.email ?? "");

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.target.value;
    setInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashOpen(true);
      setSlashQuery(val.slice(1));
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    setSlashOpen(false);
    setInput("");
    switch (cmd.action) {
      case "new":
        router.push("/chat");
        break;
      case "clear":
        setMessages(() => []);
        break;
      case "rename":
        toast("Rename is available from the sidebar chat menu.");
        break;
      case "model": {
        const modelBtn = document.querySelector<HTMLButtonElement>(
          "[data-testid='model-selector']"
        );
        modelBtn?.click();
        break;
      }
      case "theme":
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        break;
      case "delete":
        toast("Delete this chat?", {
          action: {
            label: "Delete",
            onClick: () => {
              fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                { method: "DELETE" }
              );
              router.push("/chat");
              toast.success("Chat deleted");
            },
          },
        });
        break;
      case "purge":
        toast("Delete all chats?", {
          action: {
            label: "Delete all",
            onClick: () => {
              fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
                method: "DELETE",
              });
              router.push("/chat");
              toast.success("All chats deleted");
            },
          },
        });
        break;
      default:
        break;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const runDocs4LlmConversion = useCallback(
    async (url: string) => {
      if (isGuest) {
        toast.error("Sign in to generate an MCP server");
        router.push(`/login?redirectUrl=${encodeURIComponent("/chat")}`);
        return;
      }

      setDocs4llmLoading(true);
      // Clear input immediately so the user sees the chat reset while the
      // conversion starts. The actual navigation happens as soon as the
      // server returns a project id (the heavy pipeline runs in `after()`).
      setInput("");
      setLocalStorageInput("");
      const startToast = toast.loading("Starting docs4llm pipeline…", {
        description: "Crawl → analyze → MCP server",
      });

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/convert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceUrl: url }),
          }
        );
        if (res.status === 401) {
          toast.dismiss(startToast);
          toast.error("Sign in to generate an MCP server");
          router.push(`/login?redirectUrl=${encodeURIComponent("/chat")}`);
          return;
        }
        if (!res.ok) {
          toast.dismiss(startToast);
          let serverMessage: string | null = null;
          let errorKind: string | null = null;
          try {
            const body = (await res.json()) as {
              error?: string;
              message?: string;
            };
            errorKind = body.error ?? null;
            serverMessage = body.message ?? null;
          } catch {
            // body wasn't JSON, fall through to generic message
          }

          if (res.status === 403 && errorKind === "entitlement") {
            toast.error("Upgrade your plan to keep building MCPs", {
              description:
                serverMessage ??
                "You've hit the Free plan limit (1 conversion / month). Upgrade to Starter or Pro for more.",
              duration: 12_000,
              action: {
                label: "Upgrade",
                onClick: () => router.push("/pricing"),
              },
            });
            return;
          }

          toast.error("Could not start docs4llm conversion", {
            description: serverMessage ?? "Please try again in a moment.",
          });
          return;
        }
        const { id } = (await res.json()) as { id: string };
        toast.dismiss(startToast);
        toast.success("Pipeline started", {
          description: "Live progress streaming on the conversion page.",
        });
        router.push(`/convert/${id}`);
      } catch {
        toast.dismiss(startToast);
        toast.error("Could not start docs4llm conversion");
      } finally {
        setDocs4llmLoading(false);
      }
    },
    [router, setInput, setLocalStorageInput, isGuest]
  );

  // Auto-detect a docs URL in whatever the user has typed/pasted so we can
  // surface the "convert to MCP" banner even when the toggle is off.
  const detectedUrl = useMemo(() => extractDocsUrl(input), [input]);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const showUrlBanner =
    !editingMessage &&
    detectedUrl !== null &&
    detectedUrl !== dismissedUrl &&
    !docs4llmLoading;

  const { setPreview } = useChatDocPreview();
  const {
    enabled: mcpEnabled,
    setEnabled: setMcpEnabled,
    projectId: mcpProjectId,
    setProjectId: setMcpProjectId,
    projects: mcpProjects,
    setProjects: setMcpProjects,
  } = useChatMcp();

  useEffect(() => {
    if (isGuest) {
      return;
    }
    let cancelled = false;
    fetch("/api/user/mcp-projects")
      .then(async (res) => {
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as {
          projects?: {
            id: string;
            name: string;
            sourceUrl: string | null;
            pageCount?: number;
          }[];
        };
        if (!cancelled && data.projects) {
          setMcpProjects(data.projects);
          if (!mcpProjectId && data.projects[0]) {
            setMcpProjectId(data.projects[0].id);
          }
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isGuest, mcpProjectId, setMcpProjectId, setMcpProjects]);

  useEffect(() => {
    setPreview({
      url: detectedUrl,
      docs4llmMode: hasMounted && docs4llmMode,
      isLoading: docs4llmLoading,
      isDismissed: detectedUrl !== null && detectedUrl === dismissedUrl,
    });
  }, [
    detectedUrl,
    docs4llmMode,
    docs4llmLoading,
    dismissedUrl,
    hasMounted,
    setPreview,
  ]);

  const handleBannerGenerate = useCallback(() => {
    if (!detectedUrl) {
      return;
    }
    if (isGuest) {
      toast.error("Sign in to generate an MCP server");
      router.push(`/login?redirectUrl=${encodeURIComponent("/chat")}`);
      return;
    }
    setDocs4llmMode(true);
    runDocs4LlmConversion(detectedUrl).catch(() => {
      // already toasted inside runDocs4LlmConversion
    });
  }, [detectedUrl, isGuest, router, runDocs4LlmConversion, setDocs4llmMode]);

  // Prefetch the conversion route so navigation feels instant when the
  // server returns the project id.
  useEffect(() => {
    router.prefetch("/convert/_");
  }, [router]);

  const submitForm = useCallback(() => {
    if (docs4llmMode) {
      if (isGuest) {
        toast.error("Sign in to generate an MCP server");
        router.push(`/login?redirectUrl=${encodeURIComponent("/chat")}`);
        return;
      }
      const url = extractDocsUrl(input);
      if (url) {
        runDocs4LlmConversion(url).catch(() => {
          // error already toasted inside runDocs4LlmConversion
        });
        return;
      }
      toast.error("Paste a documentation URL (https://…)");
      return;
    }

    // Auto-detect: even with the toggle off, phrases like
    // "Build an MCP from https://github.com/..." should trigger conversion
    // and flip the docs4llm toggle on for visual feedback.
    const intent = detectDocs4LlmIntent(input);
    if (intent.shouldAutoConvert && intent.url) {
      if (isGuest) {
        toast.error("Sign in to generate an MCP server");
        router.push(`/login?redirectUrl=${encodeURIComponent("/chat")}`);
        return;
      }
      setDocs4llmMode(true);
      toast.message("docs4llm mode on — generating MCP from your URL");
      runDocs4LlmConversion(intent.url).catch(() => {
        // already toasted inside runDocs4LlmConversion
      });
      return;
    }

    if (isGuest) {
      const guestUserMessages = messages.filter(
        (m) => m.role === "user"
      ).length;
      if (guestUserMessages >= GUEST_QUERY_LIMIT) {
        toast.error(
          "You've used your 5 free messages — sign in to keep chatting."
        );
        router.push(`/login?redirectUrl=${encodeURIComponent("/chat")}`);
        return;
      }
    }

    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    const userParts = [
      ...attachments.map((attachment) => ({
        type: "file" as const,
        url: attachment.url,
        name: attachment.name,
        mediaType: attachment.contentType,
      })),
      ...(input.trim()
        ? [
            {
              type: "text" as const,
              text: input,
            },
          ]
        : []),
    ];

    sendMessage({
      role: "user",
      parts: userParts,
    });

    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    docs4llmMode,
    setDocs4llmMode,
    runDocs4LlmConversion,
    isGuest,
    messages,
    router,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (_error) {
      toast.error("Failed to upload file, please try again!");
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (_error) {
        toast.error("Failed to upload files");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) {
        return;
      }

      event.preventDefault();

      setUploadQueue((prev) => [...prev, "Pasted image"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch (_error) {
        toast.error("Failed to upload pasted image(s)");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Editing message</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              onCancelEdit();
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {!editingMessage &&
        !isLoading &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf"
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="relative">
        {slashOpen && (
          <SlashCommandMenu
            onClose={() => setSlashOpen(false)}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        )}
      </div>

      {showUrlBanner && detectedUrl ? (
        <UrlDetectBanner
          loading={docs4llmLoading}
          modeEnabled={hasMounted && docs4llmMode}
          onDismiss={() => setDismissedUrl(detectedUrl)}
          onGenerate={handleBannerGenerate}
          url={detectedUrl}
        />
      ) : null}

      <PromptInput
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        onSubmit={() => {
          if (input.startsWith("/")) {
            const query = input.slice(1).trim();
            const cmd = slashCommands.find((c) => c.name === query);
            if (cmd) {
              handleSlashSelect(cmd);
            }
            return;
          }
          if (!input.trim() && attachments.length === 0) {
            return;
          }
          if (status === "ready" || status === "error") {
            submitForm();
          } else {
            toast.error("Please wait for the model to finish its response!");
          }
        }}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url)
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  url: "",
                  name: filename,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-24 text-[13px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/35"
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={(e) => {
            if (slashOpen) {
              const filtered = slashCommands.filter((cmd) =>
                cmd.name.startsWith(slashQuery.toLowerCase())
              );
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (filtered[slashIndex]) {
                  handleSlashSelect(filtered[slashIndex]);
                }
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setSlashOpen(false);
                return;
              }
            }
            if (e.key === "Escape" && editingMessage && onCancelEdit) {
              e.preventDefault();
              onCancelEdit();
            }
          }}
          placeholder={
            editingMessage
              ? "Edit your message..."
              : hasMounted && docs4llmMode
                ? "Paste docs URL — https://docs.example.com"
                : hasMounted && mcpEnabled
                  ? "Ask your documentation anything..."
                  : "Ask anything — or sign in and enable docs4llm"
          }
          ref={textareaRef}
          value={input}
        />
        <PromptInputFooter className="px-2 pb-2 sm:px-3 sm:pb-3">
          <PromptInputTools className="flex-wrap gap-1">
            <AttachmentsButton
              fileInputRef={fileInputRef}
              selectedModelId={selectedModelId}
              status={status}
            />
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
            <span data-tour="chat-docs4llm">
              <Docs4LlmModeToggle
                enabled={docs4llmMode}
                onChange={(next) => {
                  if (next && isGuest) {
                    toast.error("Sign in to generate an MCP server");
                    router.push(
                      `/login?redirectUrl=${encodeURIComponent("/chat")}`
                    );
                    return;
                  }
                  setDocs4llmMode(next);
                }}
              />
            </span>
            <Button
              aria-label="Toggle MCP docs mode"
              className={cn(
                "h-8 gap-1.5 rounded-lg px-2 text-xs",
                mcpEnabled
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground"
              )}
              onClick={() => {
                if (isGuest) {
                  toast.error("Sign in to chat with your MCP docs");
                  router.push(
                    `/login?redirectUrl=${encodeURIComponent("/chat")}`
                  );
                  return;
                }
                if (mcpProjects.length === 0) {
                  toast.error("Convert a docs URL first to unlock MCP chat");
                  return;
                }
                setMcpEnabled(!mcpEnabled);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Plug className="size-3.5" />
              MCP
            </Button>
            {mcpEnabled && mcpProjects.length > 0 ? (
              <select
                aria-label="Select MCP project"
                className="h-8 max-w-[110px] rounded-lg border border-border/50 bg-background px-1.5 text-[11px] sm:max-w-[140px] sm:px-2 sm:text-xs"
                onChange={(e) => setMcpProjectId(e.target.value)}
                value={mcpProjectId ?? mcpProjects[0]?.id}
              >
                {mcpProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : null}
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className={cn(
                "h-7 w-7 rounded-xl transition-all duration-200",
                input.trim()
                  ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                  : "bg-muted text-muted-foreground/25 cursor-not-allowed"
              )}
              data-testid="send-button"
              disabled={
                (!input.trim() && attachments.length === 0) ||
                uploadQueue.length > 0 ||
                docs4llmLoading
              }
              status={status}
              variant="secondary"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.editingMessage !== nextProps.editingMessage) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    return true;
  }
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
}) {
  return (
    <Button
      aria-label="Attach files (images or PDF)"
      className={cn(
        "h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors",
        "text-foreground hover:border-border hover:text-foreground"
      )}
      data-testid="attachments-button"
      disabled={status !== "ready"}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      title="Attach images or PDF"
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    modelsData?.capabilities ?? modelsData;
  const dynamicModels: ChatModel[] | undefined = modelsData?.models;
  const activeModels = dynamicModels ?? chatModels;

  const selectedModel =
    activeModels.find((m: ChatModel) => m.id === selectedModelId) ??
    activeModels.find((m: ChatModel) => m.id === DEFAULT_CHAT_MODEL) ??
    activeModels[0];
  const [provider] = selectedModel.id.split("/");

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button
          className="h-7 max-w-[200px] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          data-testid="model-selector"
          variant="ghost"
        >
          {provider && <ModelSelectorLogo provider={provider} />}
          <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          {(() => {
            const curatedIds = new Set(chatModels.map((m) => m.id));
            const allModels = dynamicModels
              ? [
                  ...chatModels,
                  ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
                ]
              : chatModels;

            const grouped: Record<
              string,
              { model: ChatModel; curated: boolean }[]
            > = {};
            for (const model of allModels) {
              const key = curatedIds.has(model.id)
                ? "_available"
                : model.provider;
              if (!grouped[key]) {
                grouped[key] = [];
              }
              grouped[key].push({ model, curated: curatedIds.has(model.id) });
            }

            const sortedKeys = Object.keys(grouped).sort((a, b) => {
              if (a === "_available") {
                return -1;
              }
              if (b === "_available") {
                return 1;
              }
              return a.localeCompare(b);
            });

            const providerNames: Record<string, string> = {
              alibaba: "Alibaba",
              anthropic: "Anthropic",
              "arcee-ai": "Arcee AI",
              bytedance: "ByteDance",
              cohere: "Cohere",
              deepseek: "DeepSeek",
              google: "Google",
              inception: "Inception",
              kwaipilot: "Kwaipilot",
              meituan: "Meituan",
              meta: "Meta",
              minimax: "MiniMax",
              mistral: "Mistral",
              moonshotai: "Moonshot",
              morph: "Morph",
              nvidia: "Nvidia",
              openai: "OpenAI",
              perplexity: "Perplexity",
              "prime-intellect": "Prime Intellect",
              xiaomi: "Xiaomi",
              xai: "xAI",
              zai: "Zai",
            };

            return sortedKeys.map((key) => (
              <ModelSelectorGroup
                heading={
                  key === "_available"
                    ? "Available"
                    : (providerNames[key] ?? key)
                }
                key={key}
              >
                {grouped[key].map(({ model, curated }) => {
                  const logoProvider = model.id.split("/")[0];
                  return (
                    <ModelSelectorItem
                      className={cn(
                        "flex w-full",
                        model.id === selectedModel.id &&
                          "border-b border-dashed border-foreground/50",
                        !curated && "opacity-40 cursor-default"
                      )}
                      key={model.id}
                      onSelect={() => {
                        if (!curated) {
                          return;
                        }
                        onModelChange?.(model.id);
                        setCookie("chat-model", model.id);
                        setOpen(false);
                        setTimeout(() => {
                          document
                            .querySelector<HTMLTextAreaElement>(
                              "[data-testid='multimodal-input']"
                            )
                            ?.focus();
                        }, 50);
                      }}
                      value={model.id}
                    >
                      <ModelSelectorLogo provider={logoProvider} />
                      <ModelSelectorName>{model.name}</ModelSelectorName>
                      <div className="ml-auto flex items-center gap-2 text-foreground/70">
                        {capabilities?.[model.id]?.tools && (
                          <WrenchIcon className="size-3.5" />
                        )}
                        {capabilities?.[model.id]?.vision && (
                          <EyeIcon className="size-3.5" />
                        )}
                        {capabilities?.[model.id]?.reasoning && (
                          <BrainIcon className="size-3.5" />
                        )}
                        {!curated && (
                          <LockIcon className="size-3 text-muted-foreground/50" />
                        )}
                      </div>
                    </ModelSelectorItem>
                  );
                })}
              </ModelSelectorGroup>
            ));
          })()}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="h-7 w-7 rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/25 disabled:cursor-not-allowed"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
