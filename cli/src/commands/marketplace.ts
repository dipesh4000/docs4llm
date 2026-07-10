import pc from "picocolors";
import { apiFetch, printError } from "../api.js";
import { ensureLoggedIn } from "./login.js";
import { promptInstall } from "./install.js";
import { loadConfig } from "../store.js";

type MarketplaceInstallResponse = {
  project: { id: string; name: string; sourceUrl: string | null };
  install: {
    serverName: string;
    endpointUrl: string;
    mcpToken: string;
    cursor: Record<string, unknown>;
    vscode: Record<string, unknown>;
    windsurf: Record<string, unknown>;
    claude: Record<string, unknown>;
  };
  mcp: { url: string; token: string; serverName: string };
  createdToken?: string;
  needsToken?: boolean;
  message?: string;
};

export async function runMarketplaceInstall(projectId: string): Promise<void> {
  try {
    await ensureLoggedIn();
    const config = await loadConfig();

    let detail: MarketplaceInstallResponse;
    if (config.mcpAccessToken) {
      detail = await apiFetch<MarketplaceInstallResponse>(
        `/api/cli/marketplace/${projectId}?mcpToken=${encodeURIComponent(config.mcpAccessToken)}`
      );
    } else {
      detail = await apiFetch<MarketplaceInstallResponse>(
        `/api/cli/marketplace/${projectId}`,
        { method: "POST" }
      );
      if (detail.createdToken) {
        const { saveConfig } = await import("../store.js");
        await saveConfig({
          ...config,
          mcpAccessToken: detail.createdToken,
        });
        process.stdout.write(
          `${pc.yellow("Created and saved a new MCP access token for marketplace use.")}\n`
        );
      }
    }

    if (detail.needsToken) {
      process.stderr.write(
        `${pc.red("No MCP access token.")} Run: ${pc.bold("doc2mcp token create")}\n`
      );
      process.exitCode = 1;
      return;
    }

    process.stdout.write(`\n${pc.green("Marketplace MCP ready")}\n`);
    process.stdout.write(`${pc.bold("Server:")} ${detail.mcp.serverName}\n`);
    process.stdout.write(`${pc.bold("URL:")} ${detail.mcp.url}\n`);
    process.stdout.write(
      `${pc.bold("Your token:")} ${detail.mcp.token.slice(0, 20)}…\n`
    );

    await promptInstall(detail.install);
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}
