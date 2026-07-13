import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { generateImageTool } from "./ai/tools/generate-image";
import type { generatePdfTool } from "./ai/tools/generate-pdf";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { webSearchTool } from "./ai/tools/web-search";
import type { Suggestion } from "./db/schema";
import type { DocAgentTools } from "./docs4llm/doc-agent-tools";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type webSearchToolType = InferUITool<typeof webSearchTool>;
type generateImageToolType = InferUITool<typeof generateImageTool>;
type generatePdfToolType = InferUITool<ReturnType<typeof generatePdfTool>>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  webSearch: webSearchToolType;
  generateImage: generateImageToolType;
  generatePdf: generatePdfToolType;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  list_documentation_pages: InferUITool<
    DocAgentTools["list_documentation_pages"]
  >;
  search_documentation: InferUITool<DocAgentTools["search_documentation"]>;
  get_documentation_page: InferUITool<DocAgentTools["get_documentation_page"]>;
  read_full_documentation: InferUITool<
    DocAgentTools["read_full_documentation"]
  >;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  "chat-title": string;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
