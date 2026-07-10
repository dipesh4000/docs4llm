import type { CliInstallBundle } from "@/lib/cli/install-bundle";
import { buildMarketplaceInstallTargets } from "@/lib/marketplace/install";
import { generateMcpExportBundle } from "@/services/mcp/exports";
import type { McpServerConfig, ProjectArtifacts } from "@/types/platform";

function readArtifacts(value: unknown): ProjectArtifacts | null {
  if (value && typeof value === "object") {
    return value as ProjectArtifacts;
  }
  return null;
}

export function buildCliMarketplaceInstallBundle(
  artifactsValue: unknown,
  userToken: string
): CliInstallBundle | null {
  const artifacts = readArtifacts(artifactsValue);
  const mcpConfig = artifacts?.mcpConfig as McpServerConfig | undefined;
  if (!mcpConfig) {
    return null;
  }

  const installTargets = buildMarketplaceInstallTargets(artifacts, userToken);
  if (!installTargets) {
    return null;
  }

  const exportBundle = generateMcpExportBundle({ config: mcpConfig });
  const cursorConfig = JSON.parse(installTargets.cursorConfigJson) as Record<
    string,
    unknown
  >;
  const vscodeConfig = JSON.parse(installTargets.vscodeConfigJson) as Record<
    string,
    unknown
  >;

  const windsurfArtifact = exportBundle.artifacts.find(
    (item) => item.id === "windsurf"
  );
  const claudeArtifact = exportBundle.artifacts.find(
    (item) => item.id === "claude-desktop"
  );

  const patchedWindsurf = windsurfArtifact
    ? patchExportToken(windsurfArtifact.content, userToken)
    : {};
  const patchedClaude = claudeArtifact
    ? patchExportToken(claudeArtifact.content, userToken)
    : {};

  return {
    serverName: installTargets.serverName,
    endpointUrl: installTargets.endpointUrl,
    mcpToken: userToken,
    cursor: cursorConfig,
    vscode: vscodeConfig,
    windsurf: patchedWindsurf,
    claude: patchedClaude,
  };
}

function patchExportToken(
  content: string,
  userToken: string
): Record<string, unknown> {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const json = JSON.stringify(parsed).replace(
    /Bearer\s+d2mcp_[^"]+/g,
    `Bearer ${userToken}`
  );
  return JSON.parse(json) as Record<string, unknown>;
}
