import type { ProjectArtifacts } from "@/types/platform";

const TOKEN_PLACEHOLDER = "YOUR_MCP_ACCESS_TOKEN";

/** Strip secrets from artifacts before sending to public marketplace clients. */
export function sanitizeArtifactsForMarketplace(
  artifacts: unknown
): ProjectArtifacts | null {
  if (!artifacts || typeof artifacts !== "object") {
    return null;
  }

  const source = artifacts as ProjectArtifacts;
  const { mcpAccessToken, mcpTokenHash, ...rest } = source;
  const cloned: ProjectArtifacts = { ...rest };

  if (cloned.mcpConfig?.cursorConfig?.mcpServers) {
    const servers = cloned.mcpConfig.cursorConfig.mcpServers as Record<
      string,
      { url?: string; headers?: Record<string, string> }
    >;
    const nextServers: typeof servers = {};
    for (const [name, entry] of Object.entries(servers)) {
      const headers = { ...(entry.headers ?? {}) };
      if (headers.Authorization) {
        headers.Authorization = `Bearer ${TOKEN_PLACEHOLDER}`;
      }
      nextServers[name] = { ...entry, headers };
    }
    cloned.mcpConfig = {
      ...cloned.mcpConfig,
      cursorConfig: {
        ...cloned.mcpConfig.cursorConfig,
        mcpServers: nextServers,
      },
    };
  }

  return cloned;
}

export { TOKEN_PLACEHOLDER };
