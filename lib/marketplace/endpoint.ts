import type { ProjectArtifacts } from "@/types/platform";

export function readMarketplaceEndpoint(
  artifactsValue: unknown
): { endpointUrl: string; serverName: string } | null {
  if (!artifactsValue || typeof artifactsValue !== "object") {
    return null;
  }
  const artifacts = artifactsValue as ProjectArtifacts;
  const config = artifacts.mcpConfig;
  if (!config) {
    return null;
  }
  const name = config.name || "doc2mcp";
  const servers = config.cursorConfig?.mcpServers as
    | Record<string, { url?: string }>
    | undefined;
  const entry = servers?.[name];
  if (!entry?.url) {
    return null;
  }
  return { endpointUrl: entry.url, serverName: name };
}
