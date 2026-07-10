import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { customProvider } from "ai";
import { isTestEnvironment } from "@/lib/constants";
import { ASI1_MODEL } from "./client";

const asi1 = createOpenAICompatible({
  name: "gemini",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: process.env.GEMINI_API_KEY ?? process.env.ASI_ONE_API_KEY ?? "",
});

export const asi1Provider = customProvider({
  languageModels: {
    asi1: asi1(ASI1_MODEL),
    "chat-model": asi1(ASI1_MODEL),
    "title-model": asi1(ASI1_MODEL),
  },
});

export function getAsi1Model(modelId = "asi1") {
  if (isTestEnvironment) {
    const { chatModel, titleModel } = require("@/lib/ai/models.mock");
    const { customProvider: cp } = require("ai");
    return cp({
      languageModels: {
        asi1: chatModel,
        "chat-model": chatModel,
        "title-model": titleModel,
      },
    }).languageModel(modelId === "title-model" ? "title-model" : "chat-model");
  }

  return asi1Provider.languageModel(
    modelId === "title-model" ? "title-model" : "asi1"
  );
}
