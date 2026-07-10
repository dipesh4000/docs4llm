import type { McpToolDefinition } from "@/types/platform";

/** Standard doc2mcp MCP tools — read full crawled documentation in Cursor. */
export const DOC_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "list_documentation_pages",
    description:
      "List all documentation pages crawled from the source docs site. Use first to see what is available.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_documentation_page",
    description:
      "Get the full text content of one documentation page by URL or page id from list_documentation_pages.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Exact page URL from the docs site",
        },
        id: {
          type: "string",
          description: "Page id from list_documentation_pages",
        },
      },
    },
  },
  {
    name: "search_documentation",
    description:
      "Heading-aware section search across the crawled documentation. Returns the most relevant chunks (one entry per docs section) with breadcrumbs, snippet, and source URL.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (keywords or short question)",
        },
        limit: {
          type: "number",
          description: "Max results (default 10, max 30)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_documentation_overview",
    description:
      "Get documentation overview: source URL, page count, summary, and llms.txt index for agents.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "read_full_documentation",
    description:
      "Read all crawled documentation combined into one markdown document. Use for broad context (may be large).",
    inputSchema: {
      type: "object",
      properties: {
        maxPages: {
          type: "number",
          description: "Limit number of pages (default: all)",
        },
      },
    },
  },
  {
    name: "ask_documentation",
    description:
      "Ask a natural-language question; doc2mcp answers from crawled docs using platform AI (no user API key).",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Your question about the docs",
        },
      },
      required: ["question"],
    },
  },
];
