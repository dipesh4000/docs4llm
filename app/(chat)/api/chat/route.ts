import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
import { checkBotId } from "botid/server";
import { auth, type UserType } from "@/app/(auth)/auth";
import { isAdminEmail } from "@/lib/admin/admin-access";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  allowedModelIds,
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { generatePdfTool } from "@/lib/ai/tools/generate-pdf";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { webSearchTool } from "@/lib/ai/tools/web-search";
import { isProductionEnvironment } from "@/lib/constants";
import {
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getPlatformProjectById,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import {
  buildDocAgentSystemPrompt,
  createDocAgentTools,
} from "@/lib/docs4llm/doc-agent-tools";
import type { DocMcpContext } from "@/lib/docs4llm/mcp-tools-runtime";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import { isWebSearchEnabled } from "@/lib/search/providers";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import type { CrawlResult, ProjectArtifacts } from "@/types/platform";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      messages,
      selectedChatModel,
      selectedVisibilityType,
      mcpProjectId,
    } = requestBody;

    const [, session] = await Promise.all([
      checkBotId().catch(() => null),
      auth(),
    ]);

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const chatModel = allowedModelIds.has(selectedChatModel)
      ? selectedChatModel
      : DEFAULT_CHAT_MODEL;

    const userType: UserType = session.user.type;

    if (userType === "guest") {
      await checkIpRateLimit(ipAddress(request));
    }

    // Admins (and explicit bypass) have no query limit.
    const bypassQueryLimit =
      process.env.DOCS4LLM_BYPASS_LIMITS === "1" ||
      isAdminEmail(session.user.email);

    if (!bypassQueryLimit) {
      const messageCount = await getMessageCountByUserId({
        id: session.user.id,
        differenceInHours: 1,
      });

      if (messageCount >= entitlementsByUserType[userType].maxMessagesPerHour) {
        if (userType === "guest") {
          return new ChatbotError(
            "rate_limit:chat",
            "You've used your 5 free messages. Sign in to keep chatting."
          ).toResponse();
        }
        return new ChatbotError("rate_limit:chat").toResponse();
      }
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const _modelConfig = chatModels.find((m) => m.id === chatModel);
    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    const isReasoningModel = capabilities?.reasoning === true;
    const supportsTools = capabilities?.tools === true;
    const supportsVision = capabilities?.vision === true;
    const webSearchAvailable = isWebSearchEnabled();

    // The current model can't natively see images/PDFs — if we leave the
    // file parts in, the AI SDK inlines them as base64 into the prompt and
    // we blow past the model's context window (3M+ tokens for a single PDF).
    // Replace file parts with a short text marker so the model still knows
    // an attachment was sent, but the bytes never go upstream.
    const sanitizedUiMessages: ChatMessage[] = supportsVision
      ? uiMessages
      : uiMessages.map((m) => {
          if (!m.parts?.some((p) => p.type === "file")) {
            return m;
          }
          const rewritten = m.parts.map((part) => {
            if (part.type !== "file") {
              return part;
            }
            const filename =
              (part as { filename?: string; name?: string }).filename ??
              (part as { name?: string }).name ??
              "file";
            const mediaType =
              (part as { mediaType?: string }).mediaType ?? "unknown";
            return {
              type: "text" as const,
              text: `[Attachment: ${filename} (${mediaType}) — use the generatePdf / generateImage tool if you need to act on it]`,
            };
          });
          return { ...m, parts: rewritten } as ChatMessage;
        });

    const modelMessages = await convertToModelMessages(sanitizedUiMessages);

    let docAgentCtx: DocMcpContext | null = null;
    if (mcpProjectId) {
      const project = await getPlatformProjectById({
        id: mcpProjectId,
        userId: session.user.id,
      });
      if (!project) {
        return new ChatbotError(
          "forbidden:chat",
          "MCP project not found or not owned by you."
        ).toResponse();
      }
      if (project.status !== "ready") {
        return new ChatbotError(
          "bad_request:api",
          "MCP project is not ready yet."
        ).toResponse();
      }
      docAgentCtx = {
        project: {
          id: project.id,
          name: project.name,
          sourceUrl: project.sourceUrl,
        },
        pages: (project.crawlData as CrawlResult[] | null) ?? [],
        artifacts: project.artifacts as ProjectArtifacts | null,
      };
    }

    const docTools = docAgentCtx ? createDocAgentTools(docAgentCtx) : null;
    const baseActiveTools = docTools
      ? ([
          "list_documentation_pages",
          "search_documentation",
          "get_documentation_page",
          "read_full_documentation",
        ] as const)
      : ([
          "getWeather",
          "generateImage",
          "generatePdf",
          "createDocument",
          "editDocument",
          "updateDocument",
          "requestSuggestions",
          ...(webSearchAvailable ? (["webSearch"] as const) : []),
        ] as const);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const chatTools = {
          getWeather,
          webSearch: webSearchTool,
          generateImage: generateImageTool,
          generatePdf: generatePdfTool({ userId: session.user.id }),
          createDocument: createDocument({
            session,
            dataStream,
            modelId: chatModel,
          }),
          editDocument: editDocument({ dataStream, session }),
          updateDocument: updateDocument({
            session,
            dataStream,
            modelId: chatModel,
          }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
            modelId: chatModel,
          }),
          ...(docTools ?? {}),
        };

        const result = streamText({
          model: getLanguageModel(chatModel),
          system: docAgentCtx
            ? buildDocAgentSystemPrompt(docAgentCtx.project.name)
            : systemPrompt({
                requestHints,
                supportsTools,
                webSearchAvailable,
              }),
          messages: modelMessages,
          stopWhen: stepCountIs(docTools ? 8 : 5),
          experimental_activeTools:
            isReasoningModel && !supportsTools ? [] : [...baseActiveTools],
          providerOptions: {},
          tools: chatTools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );

        if (titlePromise) {
          try {
            const title = await titlePromise;
            dataStream.write({ type: "data-chat-title", data: title });
            updateChatTitleById({ chatId: id, title });
          } catch (_) {
            /* non-fatal */
          }
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: (error) => {
        const msg =
          error instanceof Error ? error.message : String(error ?? "");
        if (
          msg.includes(
            "AI Gateway requires a valid credit card on file to service requests"
          )
        ) {
          return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";
        }
        // OpenAI-compatible context overflow surfaces as a 400 with a
        // "context_length_exceeded" code (sometimes wrapped in Zod parse
        // failures because the upstream uses `type: 400` instead of a string).
        if (
          msg.includes("context_length_exceeded") ||
          msg.includes("longer than the model") ||
          msg.includes("maximum context length")
        ) {
          return "This conversation is too long for the current model. Start a new chat or remove large attachments and try again.";
        }
        if (
          msg.includes("OpenAIBackendError") ||
          msg.includes("BadRequestError")
        ) {
          return "The AI provider rejected the request. Please try again with a shorter message or without the attachment.";
        }
        console.error("streamText onError:", msg);
        return "Something went wrong while generating a response. Please try again.";
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatbotError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatbotError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
