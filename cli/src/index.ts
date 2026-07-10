#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { runWhoami, runLogout } from "./commands/account.js";
import { runChat } from "./commands/chat.js";
import { runConvert, runList } from "./commands/convert.js";
import { runInstallCommand } from "./commands/install.js";
import { runLogin } from "./commands/login.js";
import { runMarketplaceInstall } from "./commands/marketplace.js";
import { runTokenCreate, runTokenList } from "./commands/token.js";
import { printCompactBanner } from "./banner.js";

// Injected at build time by tsup `define` from package.json.
declare const __CLI_VERSION__: string;

const program = new Command();

program
  .name("doc2mcp")
  .description("Generate documentation MCP servers from your terminal")
  .version(__CLI_VERSION__, "-v, --version", "Print the installed CLI version");

program
  .command("login")
  .description("Authorize the CLI via browser")
  .action(async () => {
    await runLogin();
  });

program
  .command("logout")
  .description("Remove stored credentials")
  .action(async () => {
    await runLogout();
  });

program
  .command("whoami")
  .description("Show the logged-in user")
  .action(async () => {
    await runWhoami();
  });

program
  .command("list")
  .description("List your MCP projects")
  .action(async () => {
    await runList();
  });

program
  .command("install <projectId>")
  .description("Install your own MCP into Cursor, VS Code, Claude, or Windsurf")
  .action(async (projectId: string) => {
    await runInstallCommand(projectId);
  });

const token = program.command("token").description("Manage MCP access tokens for marketplace");

token
  .command("create")
  .description("Create an MCP access token for marketplace installs")
  .option("-n, --name <name>", "Token label", "Marketplace")
  .action(async (options: { name: string }) => {
    await runTokenCreate(options.name);
  });

token
  .command("list")
  .description("List your MCP access tokens")
  .action(async () => {
    await runTokenList();
  });

program
  .command("marketplace <projectId>")
  .description("Install a marketplace MCP using your profile access token")
  .action(async (projectId: string) => {
    await runMarketplaceInstall(projectId);
  });

program
  .command("chat [target]")
  .description("Chat with docs in the terminal; target can be a project id or docs URL")
  .option("-m, --message <text>", "Ask a single question and exit")
  .action(async (target: string | undefined, options: { message?: string }) => {
    await runChat(target, options);
  });

program
  .argument("[url]", "Documentation URL to convert")
  .action(async (url?: string) => {
    if (!url) {
      printCompactBanner();
      program.help();
      return;
    }

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("URL must start with http:// or https://");
      }
    } catch {
      process.stderr.write(
        `${pc.red("Error:")} Invalid URL. Example: doc2mcp https://docs.example.com\n`
      );
      process.exitCode = 1;
      return;
    }

    await runConvert(url);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${pc.red("Error:")} ${message}\n`);
  process.exit(1);
});
