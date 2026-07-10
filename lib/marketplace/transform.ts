import type {
  CompressedTool,
  ProjectArtifacts,
  SourceType,
} from "@/types/platform";
import type {
  MarketplaceMcp,
  MarketplaceMcpDetail,
  MarketplaceTool,
} from "./types";

type ProjectRow = {
  id: string;
  name: string;
  sourceUrl: string | null;
  sourceType: SourceType;
  artifacts: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerName: string | null;
};

function ownerDisplay(name: string | null): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Community";
}

function iso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function readArtifacts(value: unknown): ProjectArtifacts | null {
  if (value && typeof value === "object") {
    return value as ProjectArtifacts;
  }
  return null;
}

function toolCountOf(artifacts: ProjectArtifacts | null): number {
  return artifacts?.compressedTools?.length ?? 0;
}

/**
 * Turn raw llms.txt markdown into a clean, human-readable snippet.
 * Strips headings, list/quote markers, links, source URLs and stray
 * markdown so the marketplace never shows raw `# ... > ...` text.
 */
function cleanSummaryText(raw: string): string {
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s*/gm, " ")
    .replace(/^\s*[>\-*+]\s*/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/source:\s*\S+/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*`_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 200) {
    return cleaned;
  }
  const slice = cleaned.slice(0, 200);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 120 ? lastSpace : 200).trim()}…`;
}

export function toMarketplaceMcp(project: ProjectRow): MarketplaceMcp {
  const artifacts = readArtifacts(project.artifacts);
  const registry = artifacts?.registry;
  const isListed = registry?.status === "published";
  return {
    id: project.id,
    name: project.name,
    sourceUrl: project.sourceUrl,
    sourceType: project.sourceType,
    ownerName: ownerDisplay(project.ownerName),
    toolCount: toolCountOf(artifacts),
    pageCount: artifacts?.docsPageCount ?? 0,
    mcpScore: artifacts?.qualityScore?.mcpScore ?? null,
    registryUrl: isListed ? (registry?.url ?? null) : null,
    registryName: isListed ? (registry?.name ?? null) : null,
    createdAt: iso(project.createdAt),
    updatedAt: iso(project.updatedAt),
  };
}

export function toMarketplaceMcpDetail(
  project: ProjectRow
): MarketplaceMcpDetail {
  const base = toMarketplaceMcp(project);
  const artifacts = readArtifacts(project.artifacts);
  const compressed: CompressedTool[] = artifacts?.compressedTools ?? [];
  const tools: MarketplaceTool[] = compressed.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));

  const summary = cleanSummaryText(artifacts?.llmsTxt ?? "");

  return {
    ...base,
    summary,
    tools,
    docsScore: artifacts?.qualityScore?.docsScore ?? null,
    endpointCount: artifacts?.endpoints?.length ?? 0,
  };
}
