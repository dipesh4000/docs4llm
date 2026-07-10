"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Download } from "lucide-react";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { MessageContent } from "../ai-elements/message";
import { Shimmer } from "../ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../ai-elements/tool";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";
import { MessageWithMedia } from "./message-with-media";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

function imageFileName(prompt?: string): string {
  const base = (prompt ?? "doc2mcp-image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "doc2mcp-image"}.png`;
}

async function downloadImage(src: string, filename: string): Promise<void> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, "_blank", "noopener,noreferrer");
  }
}

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages: _setMessages,
  regenerate: _regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
  onEdit,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  onEdit?: (message: ChatMessage) => void;
}) => {
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = message.parts?.some(
    (part) =>
      (part.type === "text" && part.text?.trim().length > 0) ||
      (part.type === "reasoning" &&
        "text" in part &&
        part.text?.trim().length > 0) ||
      part.type.startsWith("tool-")
  );
  const isThinking = isAssistant && isLoading && !hasAnyContent;

  const attachments = attachmentsFromMessage.length > 0 && (
    <div
      className="flex flex-row justify-end gap-2"
      data-testid={"message-attachments"}
    >
      {attachmentsFromMessage.map((attachment) => (
        <PreviewAttachment
          attachment={{
            name: attachment.filename ?? "file",
            contentType: attachment.mediaType,
            url: attachment.url,
          }}
          key={attachment.url}
        />
      ))}
    </div>
  );

  const mergedReasoning = message.parts?.reduce(
    (acc, part) => {
      if (part.type === "reasoning" && part.text?.trim().length > 0) {
        return {
          text: acc.text ? `${acc.text}\n\n${part.text}` : part.text,
          isStreaming: "state" in part ? part.state === "streaming" : false,
          rendered: false,
        };
      }
      return acc;
    },
    { text: "", isStreaming: false, rendered: false }
  ) ?? { text: "", isStreaming: false, rendered: false };

  const parts = message.parts?.map((part, index) => {
    const { type } = part;
    const key = `message-${message.id}-part-${index}`;

    if (type === "reasoning") {
      if (!mergedReasoning.rendered && mergedReasoning.text) {
        mergedReasoning.rendered = true;
        return (
          <MessageReasoning
            isLoading={isLoading || mergedReasoning.isStreaming}
            key={key}
            reasoning={mergedReasoning.text}
          />
        );
      }
      return null;
    }

    if (type === "text") {
      return (
        <MessageContent
          className={cn("text-[13px] leading-[1.65]", {
            "w-fit max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 shadow-[var(--shadow-card)]":
              message.role === "user",
          })}
          data-testid="message-content"
          key={key}
        >
          <MessageWithMedia text={sanitizeText(part.text)} />
        </MessageContent>
      );
    }

    if (type === "tool-getWeather") {
      const { toolCallId, state } = part;
      const approvalId = (part as { approval?: { id: string } }).approval?.id;
      const isDenied =
        state === "output-denied" ||
        (state === "approval-responded" &&
          (part as { approval?: { approved?: boolean } }).approval?.approved ===
            false);
      const widthClass = "w-[min(100%,450px)]";

      if (state === "output-available") {
        return (
          <div className={widthClass} key={toolCallId}>
            <Weather weatherAtLocation={part.output} />
          </div>
        );
      }

      if (isDenied) {
        return (
          <div className={widthClass} key={toolCallId}>
            <Tool className="w-full" defaultOpen={true}>
              <ToolHeader state="output-denied" type="tool-getWeather" />
              <ToolContent>
                <div className="px-4 py-3 text-muted-foreground text-sm">
                  Weather lookup was denied.
                </div>
              </ToolContent>
            </Tool>
          </div>
        );
      }

      if (state === "approval-responded") {
        return (
          <div className={widthClass} key={toolCallId}>
            <Tool className="w-full" defaultOpen={true}>
              <ToolHeader state={state} type="tool-getWeather" />
              <ToolContent>
                <ToolInput input={part.input} />
              </ToolContent>
            </Tool>
          </div>
        );
      }

      return (
        <div className={widthClass} key={toolCallId}>
          <Tool className="w-full" defaultOpen={true}>
            <ToolHeader state={state} type="tool-getWeather" />
            <ToolContent>
              {(state === "input-available" ||
                state === "approval-requested") && (
                <ToolInput input={part.input} />
              )}
              {state === "approval-requested" && approvalId && (
                <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                  <button
                    className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      addToolApprovalResponse({
                        id: approvalId,
                        approved: false,
                        reason: "User denied weather lookup",
                      });
                    }}
                    type="button"
                  >
                    Deny
                  </button>
                  <button
                    className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                    onClick={() => {
                      addToolApprovalResponse({
                        id: approvalId,
                        approved: true,
                      });
                    }}
                    type="button"
                  >
                    Allow
                  </button>
                </div>
              )}
            </ToolContent>
          </Tool>
        </div>
      );
    }

    if (type === "tool-createDocument") {
      const { toolCallId } = part;

      if (part.output && "error" in part.output) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error creating document: {String(part.output.error)}
          </div>
        );
      }

      return (
        <DocumentPreview
          isReadonly={isReadonly}
          key={toolCallId}
          result={part.output}
        />
      );
    }

    if (type === "tool-updateDocument") {
      const { toolCallId } = part;

      if (part.output && "error" in part.output) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error updating document: {String(part.output.error)}
          </div>
        );
      }

      return (
        <div className="relative" key={toolCallId}>
          <DocumentPreview
            args={{ ...part.output, isUpdate: true }}
            isReadonly={isReadonly}
            result={part.output}
          />
        </div>
      );
    }

    if (type === "tool-webSearch") {
      const { toolCallId, state } = part;
      return (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={false}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-webSearch" />
          <ToolContent>
            {state === "input-available" && <ToolInput input={part.input} />}
            {state === "output-available" && (
              <ToolOutput
                errorText={undefined}
                output={
                  part.output && "results" in part.output ? (
                    <div className="space-y-2 px-4 py-3 text-sm">
                      {part.output.results.length === 0 ? (
                        <p className="text-muted-foreground">
                          {part.output.note ?? "No results."}
                        </p>
                      ) : (
                        part.output.results.map((r) => (
                          <a
                            className="block rounded-md border border-border/40 p-2 transition-colors hover:bg-muted/40"
                            href={r.url}
                            key={r.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <p className="truncate font-medium text-foreground">
                              {r.title}
                            </p>
                            <p className="truncate text-muted-foreground text-xs">
                              {r.url}
                            </p>
                            {r.snippet ? (
                              <p className="mt-1 line-clamp-2 text-muted-foreground/90 text-xs">
                                {r.snippet}
                              </p>
                            ) : null}
                          </a>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-muted-foreground text-sm">
                      No search results.
                    </div>
                  )
                }
              />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-generateImage") {
      const { toolCallId, state } = part;
      return (
        <Tool
          className="w-[min(100%,560px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-generateImage" />
          <ToolContent>
            {state === "input-available" && <ToolInput input={part.input} />}
            {state === "output-available" && (
              <ToolOutput
                errorText={undefined}
                output={(() => {
                  const out = part.output as
                    | {
                        ok?: boolean;
                        url?: string | null;
                        b64Json?: string | null;
                        prompt?: string;
                        revisedPrompt?: string | null;
                        error?: string;
                      }
                    | null
                    | undefined;
                  if (!out || out.ok === false) {
                    return (
                      <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
                        {out?.error ?? "Image generation failed."}
                      </div>
                    );
                  }
                  const src = out.url
                    ? out.url
                    : out.b64Json
                      ? `data:image/png;base64,${out.b64Json}`
                      : null;
                  if (!src) {
                    return (
                      <div className="px-4 py-3 text-muted-foreground text-sm">
                        The model returned no image.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2 px-3 py-3">
                      <div className="group relative">
                        {/** biome-ignore lint/performance/noImgElement: external generated image, next/image needs domain whitelist */}
                        <img
                          alt={out.prompt ?? "Generated image"}
                          className="w-full rounded-lg border border-border/40"
                          src={src}
                        />
                        <button
                          aria-label="Download image"
                          className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1.5 font-medium text-white text-xs opacity-0 backdrop-blur-sm transition-all hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100"
                          onClick={() =>
                            downloadImage(src, imageFileName(out.prompt))
                          }
                          type="button"
                        >
                          <Download className="size-3.5" />
                          Download
                        </button>
                      </div>
                      {out.revisedPrompt ? (
                        <p className="px-1 text-muted-foreground text-xs">
                          {out.revisedPrompt}
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
              />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-generatePdf") {
      const { toolCallId, state } = part;
      return (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-generatePdf" />
          <ToolContent>
            {state === "input-available" && <ToolInput input={part.input} />}
            {state === "output-available" && (
              <ToolOutput
                errorText={undefined}
                output={(() => {
                  const out = part.output as
                    | {
                        ok?: boolean;
                        url?: string;
                        name?: string;
                        title?: string;
                        size?: number;
                        error?: string;
                      }
                    | null
                    | undefined;
                  if (!out || out.ok === false || !out.url) {
                    return (
                      <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
                        {out?.error ?? "PDF generation failed."}
                      </div>
                    );
                  }
                  const sizeKb = out.size
                    ? `${Math.max(1, Math.round(out.size / 1024))} KB`
                    : "";
                  return (
                    <a
                      className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40"
                      download={out.name}
                      href={out.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 font-mono text-[10px] text-rose-600 dark:text-rose-300">
                        PDF
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground text-sm">
                          {out.title ?? out.name}
                        </span>
                        <span className="block truncate text-muted-foreground text-xs">
                          {out.name}
                          {sizeKb ? ` · ${sizeKb}` : ""} · click to download
                        </span>
                      </span>
                    </a>
                  );
                })()}
              />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-requestSuggestions") {
      const { toolCallId, state } = part;

      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-requestSuggestions" />
          <ToolContent>
            {state === "input-available" && <ToolInput input={part.input} />}
            {state === "output-available" && (
              <ToolOutput
                errorText={undefined}
                output={
                  "error" in part.output ? (
                    <div className="rounded border p-2 text-red-500">
                      Error: {String(part.output.error)}
                    </div>
                  ) : (
                    <DocumentToolResult
                      isReadonly={isReadonly}
                      result={part.output}
                      type="request-suggestions"
                    />
                  )
                }
              />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (
      type === "tool-list_documentation_pages" ||
      type === "tool-search_documentation" ||
      type === "tool-get_documentation_page" ||
      type === "tool-read_full_documentation"
    ) {
      const docPart = part as {
        toolCallId: string;
        state: string;
        input?: unknown;
        output?: unknown;
      };
      const { toolCallId, state } = docPart;
      const rawOutput = docPart.output;
      const outputText =
        state === "output-available" && typeof rawOutput === "string"
          ? rawOutput
          : state === "output-available" && rawOutput !== undefined
            ? JSON.stringify(rawOutput, null, 2)
            : undefined;

      return (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={state !== "output-available"}
          key={toolCallId}
        >
          <ToolHeader state={state as never} type={type} />
          <ToolContent>
            {docPart.input ? <ToolInput input={docPart.input} /> : null}
            {outputText ? (
              <ToolOutput
                errorText={undefined}
                output={
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
                    {outputText}
                  </pre>
                }
              />
            ) : null}
          </ToolContent>
        </Tool>
      );
    }

    return null;
  });

  const actions = !isReadonly && (
    <MessageActions
      chatId={chatId}
      isLoading={isLoading}
      key={`action-${message.id}`}
      message={message}
      onEdit={onEdit ? () => onEdit(message) : undefined}
      vote={vote}
    />
  );

  const content = isThinking ? (
    <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
      <Shimmer className="font-medium" duration={1}>
        Thinking...
      </Shimmer>
    </div>
  ) : (
    <>
      {attachments}
      {parts}
      {actions}
    </>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        !isAssistant && "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      )}
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          isUser ? "flex flex-col items-end gap-2" : "flex items-start gap-3"
        )}
      >
        {isAssistant && (
          <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={13} />
            </div>
          </div>
        )}
        {isAssistant ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">{content}</div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message w-full"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
            <SparklesIcon size={13} />
          </div>
        </div>

        <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
          <Shimmer className="font-medium" duration={1}>
            Thinking...
          </Shimmer>
        </div>
      </div>
    </div>
  );
};
