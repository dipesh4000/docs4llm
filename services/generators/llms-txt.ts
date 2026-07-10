import type {
  ApiEndpoint,
  CompressedTool,
  CrawlResult,
} from "@/types/platform";

type LlmsTxtInput = {
  name: string;
  summary: string;
  sourceUrl: string;
  pages: CrawlResult[];
  endpoints: ApiEndpoint[];
  tools: CompressedTool[];
  useCases: string[];
};

export function generateLlmsTxt(input: LlmsTxtInput): string {
  const toolSection = input.tools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  const endpointSection = input.endpoints
    .slice(0, 30)
    .map((e) => `- ${e.method} ${e.path}${e.summary ? `: ${e.summary}` : ""}`)
    .join("\n");

  const pageSection = input.pages
    .map((p) => `- [${p.title}](${p.url}) (${p.type})`)
    .join("\n");

  const useCaseSection = input.useCases.map((u) => `- ${u}`).join("\n");

  return `# ${input.name}

> ${input.summary}

Source: ${input.sourceUrl}

## Documentation pages (${input.pages.length})

${pageSection || "- No pages crawled"}

## MCP tools (doc2mcp)

Use these tools in Cursor to read full page content:

- list_documentation_pages
- get_documentation_page
- search_documentation
- get_documentation_overview
- read_full_documentation

## API endpoints (reference)

${endpointSection || "- No endpoints detected"}

## Compressed API tools

${toolSection || "- No compressed tools"}

## Use cases

${useCaseSection || "- Explore the documentation via MCP"}
`;
}
