import pc from "picocolors";
import { apiFetch, printError } from "../api.js";
import { ensureLoggedIn } from "./login.js";
import { loadConfig, saveConfig } from "../store.js";

type TokenListResponse = {
  tokens: Array<{
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
  }>;
};

type TokenCreateResponse = {
  token: {
    id: string;
    name: string;
    plaintext: string;
  };
};

export async function runTokenCreate(name = "Marketplace"): Promise<void> {
  try {
    await ensureLoggedIn();
    const data = await apiFetch<TokenCreateResponse>("/api/cli/mcp-tokens", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    const config = await loadConfig();
    await saveConfig({
      ...config,
      mcpAccessToken: data.token.plaintext,
    });

    process.stdout.write(`${pc.green("MCP access token created")}\n`);
    process.stdout.write(`${pc.bold("Name:")} ${data.token.name}\n`);
    process.stdout.write(`${pc.bold("Token:")} ${data.token.plaintext}\n`);
    process.stdout.write(
      `${pc.dim("Saved to ~/.doc2mcp/config.json as mcpAccessToken")}\n`
    );
    process.stdout.write(
      `${pc.dim("Use this token for any marketplace MCP install.")}\n`
    );
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}

export async function runTokenList(): Promise<void> {
  try {
    await ensureLoggedIn();
    const data = await apiFetch<TokenListResponse>("/api/cli/mcp-tokens");
    if (data.tokens.length === 0) {
      process.stdout.write(`${pc.dim("No MCP access tokens yet.")}\n`);
      process.stdout.write(`${pc.dim("Run: doc2mcp token create")}\n`);
      return;
    }

    for (const token of data.tokens) {
      const status = token.active ? pc.green("active") : pc.dim("revoked");
      process.stdout.write(
        `${pc.bold(token.name)} ${status} ${pc.dim(token.id)}\n`
      );
    }

    const config = await loadConfig();
    if (config.mcpAccessToken) {
      process.stdout.write(
        `\n${pc.dim("Stored CLI token:")} ${config.mcpAccessToken.slice(0, 16)}…\n`
      );
    }
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}
