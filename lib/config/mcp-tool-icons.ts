export const MCP_TOOL_ICONS = [
  { name: "Cursor", src: "/icons/tools/cursor.svg" },
  { name: "Claude", src: "/icons/tools/claude.svg" },
  { name: "VS Code", src: "/icons/tools/visualstudiocode.svg" },
  { name: "Windsurf", src: "/icons/tools/windsurf.svg" },
  { name: "OpenAI", src: "/icons/tools/openai.svg" },
] as const;

export type McpToolIcon = (typeof MCP_TOOL_ICONS)[number];
