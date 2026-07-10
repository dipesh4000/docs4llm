import type { SourceType } from "@/types/platform";

export type MarketplaceTool = {
  name: string;
  description: string;
};

export type MarketplaceMcp = {
  id: string;
  name: string;
  sourceUrl: string | null;
  sourceType: SourceType;
  ownerName: string;
  toolCount: number;
  pageCount: number;
  /** 0..100 MCP correctness score, when available. */
  mcpScore: number | null;
  /** Official MCP Registry listing URL, when the server is published. */
  registryUrl: string | null;
  /** Fully-qualified registry name, e.g. io.github.doc2mcp/stripe. */
  registryName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceMcpDetail = MarketplaceMcp & {
  summary: string;
  tools: MarketplaceTool[];
  docsScore: number | null;
  endpointCount: number;
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  url: "Docs site",
  github: "GitHub",
  markdown: "Markdown",
  openapi: "OpenAPI",
  postman: "Postman",
  html: "HTML",
  gitbook: "GitBook",
};
