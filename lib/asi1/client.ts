import "server-only";

import { enhanceImagePrompt } from "@/lib/asi1/image-prompt";

/**
 * AI client. Backed by Google Gemini.
 *
 * Text/chat uses Gemini's OpenAI-compatible endpoint so the request/response
 * (and SSE streaming) shapes stay identical to the previous provider; image
 * generation uses the native `generateContent` endpoint (Gemini 3 Pro Image
 * model returns base64 PNG via inlineData with 2K imageConfig).
 *
 * Function names keep their historical `asi1*` prefix so existing callers do
 * not need to change; the implementation underneath is Gemini.
 */

const GEMINI_OPENAI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai";
const GEMINI_NATIVE_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

// Default to flash-lite: gemini-2.5-flash is a "thinking" model that burns the
// token budget on internal reasoning (often returning empty content) and is
// rate-limited / 503-prone on the free tier, which surfaced as "Failed after 3
// attempts / Too Many Requests" in chat. flash-lite returns content reliably,
// is faster, and has higher free-tier limits.
export const ASI1_MODEL =
  readEnv("GEMINI_MODEL") ?? readEnv("ASI1_MODEL") ?? "gemini-2.5-flash-lite";
export const ASI1_IMAGE_MODEL =
  readEnv("GEMINI_IMAGE_MODEL") ??
  readEnv("ASI1_IMAGE_MODEL") ??
  "gemini-3-pro-image-preview";
const DEFAULT_TEXT_FALLBACK_MODELS = [
  ASI1_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];

export type Asi1Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type Asi1ChatCompletionRequest = {
  model: string;
  messages: Asi1Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
};

export type Asi1ChatCompletionResponse = {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

function getApiKey(): string {
  const key = readEnv("GEMINI_API_KEY") ?? readEnv("ASI_ONE_API_KEY");
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

function getImageApiKey(): string {
  const key = readEnv("GEMINI_API_KEY");
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured (required for native Gemini image generation)"
    );
  }
  return key;
}

export async function asi1ChatCompletion(
  request: Omit<Asi1ChatCompletionRequest, "model"> & { model?: string }
): Promise<Asi1ChatCompletionResponse> {
  const response = await fetch(`${GEMINI_OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: ASI1_MODEL,
      ...request,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<Asi1ChatCompletionResponse>;
}

export async function asi1ChatCompletionStream(
  request: Omit<Asi1ChatCompletionRequest, "model"> & {
    model?: string;
    /** Abort the upstream fetch on client disconnect / idle timeout. */
    signal?: AbortSignal;
  }
): Promise<Response> {
  const { signal, ...rest } = request;
  const response = await fetch(`${GEMINI_OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: ASI1_MODEL,
      stream: true,
      ...rest,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  return response;
}

export type Asi1ImageSize =
  | ""
  | "256x256"
  | "512x512"
  | "1024x1024"
  | "1024x1792"
  | "1792x1024";

export type Asi1ImageGenerationRequest = {
  prompt: string;
  topic?: string;
  size?: Asi1ImageSize;
  model?: string;
  n?: number;
};

export type Asi1ImageGenerationResponse = {
  created?: number;
  data?: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  /** Some providers return a single shorthand `image_url`. */
  image_url?: string;
};

export type GeneratedImage = {
  url?: string;
  b64Json?: string;
  revisedPrompt?: string;
};

type GeminiInlineData = { mimeType?: string; data?: string };
type GeminiPart = {
  text?: string;
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
};
type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

function getGeminiTextModels(): string[] {
  const configured = process.env.GEMINI_FALLBACK_MODELS?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  const models =
    configured && configured.length > 0
      ? configured
      : DEFAULT_TEXT_FALLBACK_MODELS;
  return Array.from(new Set(models));
}

function isRetriableGeminiError(error: Error): boolean {
  return /Gemini API error \((429|500|502|503|504)\)|UNAVAILABLE|RESOURCE_EXHAUSTED|rate.?limit|overloaded|high demand/i.test(
    error.message
  );
}

function sizeToAspectRatio(size?: Asi1ImageSize): string {
  if (size === "1024x1792") {
    return "9:16";
  }
  if (size === "1792x1024") {
    return "16:9";
  }
  return "1:1";
}

const IMAGE_MODEL_FALLBACKS = [
  ASI1_IMAGE_MODEL,
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
] as const;

function imageModelCandidates(requested?: string): string[] {
  const models = requested
    ? [requested, ...IMAGE_MODEL_FALLBACKS]
    : [...IMAGE_MODEL_FALLBACKS];
  return Array.from(new Set(models.filter(Boolean)));
}

function supportsHighResImage(model: string): boolean {
  return /gemini-3(?:\.\d+)?-(?:pro|flash)-image/i.test(model);
}

function buildImageGenerationConfig(model: string, aspectRatio: string) {
  const imageConfig: { aspectRatio: string; imageSize?: string } = {
    aspectRatio,
  };
  if (supportsHighResImage(model)) {
    imageConfig.imageSize = "2K";
  }

  return {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig,
  };
}

function isRetriableImageStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function parseGeminiImageResponse(
  data: GeminiGenerateContentResponse
): GeneratedImage[] {
  const parts = data.candidates?.at(0)?.content?.parts ?? [];
  const images: GeneratedImage[] = [];
  let revisedPrompt: string | undefined;

  for (const part of parts) {
    if (part.text) {
      revisedPrompt = part.text;
    }
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      images.push({ b64Json: inline.data, revisedPrompt });
    }
  }

  return images;
}

async function requestGeminiImage(
  model: string,
  prompt: string,
  aspectRatio: string
): Promise<GeneratedImage[]> {
  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${GEMINI_NATIVE_BASE_URL}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": getImageApiKey(),
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: buildImageGenerationConfig(model, aspectRatio),
        }),
        signal: AbortSignal.timeout(180_000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      lastError = new Error(
        `Gemini image API error (${response.status}): ${errorText}`
      );
      if (
        isRetriableImageStatus(response.status) &&
        attempt < maxAttempts - 1
      ) {
        const delay = 2 ** attempt * 1500 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const images = parseGeminiImageResponse(data);
    if (images.length === 0) {
      lastError = new Error(
        `Gemini image model ${model} returned no image data`
      );
      if (attempt < maxAttempts - 1) {
        continue;
      }
      throw lastError;
    }

    return images;
  }

  throw lastError ?? new Error("Gemini image request failed");
}

/**
 * Generate an image with Gemini image models (Pro first, Flash fallback).
 *
 *   POST {base}/models/{imageModel}:generateContent
 */
export async function asi1GenerateImage(
  request: Asi1ImageGenerationRequest
): Promise<{ images: GeneratedImage[]; raw: Asi1ImageGenerationResponse }> {
  const enhancedPrompt = enhanceImagePrompt(request.prompt, request.topic);
  const aspectRatio = sizeToAspectRatio(request.size);
  const models = imageModelCandidates(request.model);

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const images = await requestGeminiImage(
        model,
        enhancedPrompt,
        aspectRatio
      );
      const raw: Asi1ImageGenerationResponse = {
        data: images.map((img) => ({
          b64_json: img.b64Json,
          revised_prompt: img.revisedPrompt,
        })),
      };
      return { images, raw };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!isRetriableGeminiError(lastError)) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Gemini image request failed");
}

/**
 * Generate text via Gemini chat completions.
 *
 * Defaults tuned for doc2mcp's actual workload (structured extraction,
 * documentation Q&A, deterministic API simulation):
 *   - temperature: 0.1 — doc2mcp parses JSON out of nearly every response;
 *     high temperature wastes tokens on creative phrasing and produces
 *     unparseable output ~5-10% of the time.
 *   - max_tokens: 2048 — the longest legitimate response in this codebase is
 *     the analyze step's endpoint list, which empirically fits in ~1500
 *     tokens. Lowering the cap halves the worst-case wait.
 *
 * Retries use exponential backoff WITH jitter to avoid thundering-herd during
 * regional outages.
 */
export async function asi1GenerateText(
  messages: Asi1Message[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<{ text: string; usage?: Asi1ChatCompletionResponse["usage"] }> {
  const maxRetries = 2;
  let lastError: Error | null = null;
  const temperature = options?.temperature ?? 0.1;
  const maxTokens = options?.max_tokens ?? 2048;

  for (const model of getGeminiTextModels()) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await asi1ChatCompletion({
          messages,
          model,
          temperature,
          max_tokens: maxTokens,
        });
        const text = result.choices.at(0)?.message.content ?? "";
        return { text, usage: result.usage };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!isRetriableGeminiError(lastError)) {
          throw lastError;
        }
        if (attempt < maxRetries - 1) {
          const base = 2 ** attempt * 1500;
          const jitter = Math.random() * 750;
          await new Promise((resolve) => setTimeout(resolve, base + jitter));
        }
      }
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}
