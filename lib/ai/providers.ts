import { getAsi1Model } from "@/lib/asi1/provider";

export function getLanguageModel(modelId: string) {
  return getAsi1Model(modelId);
}

export function getTitleModel() {
  return getAsi1Model("title-model");
}
