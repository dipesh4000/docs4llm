export const DEFAULT_CHAT_MODEL = "asi1";

export const titleModel = {
  id: "asi1",
  name: "Gemini",
  provider: "gemini",
  description: "Google Gemini model",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

export const chatModels: ChatModel[] = [
  {
    id: "asi1",
    name: "Gemini",
    provider: "gemini",
    description:
      "Production AI for docs ingestion, MCP generation, and developer workflows",
  },
];

// biome-ignore lint/suspicious/useAwait: signature stays async for future async work
export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  return {
    asi1: {
      tools: true,
      vision: true,
      // flash-lite is not a thinking model; don't request/forward reasoning.
      reasoning: false,
    },
  };
}

export const isDemo = process.env.IS_DEMO === "1";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export async function getAllGatewayModels(): Promise<
  GatewayModelWithCapabilities[]
> {
  const caps = await getCapabilities();
  return chatModels.map((m) => ({
    ...m,
    capabilities: caps[m.id] ?? {
      tools: true,
      vision: true,
      reasoning: false,
    },
  }));
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
