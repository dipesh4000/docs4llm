import { confirm, multiselect } from "@clack/prompts";
import pc from "picocolors";
import { ensureLoggedIn } from "./login.js";
import { apiFetch, printError } from "../api.js";
import { detectClients } from "../installers/detect.js";
import { installToClient } from "../installers/install.js";
import type { InstallPayload } from "../installers/install.js";

type InstallBundle = InstallPayload;

export async function promptInstall(install: InstallBundle): Promise<void> {
  const shouldInstall = await confirm({
    message: "Install this MCP into your editor?",
    initialValue: true,
  });

  if (shouldInstall !== true) {
    return;
  }

  const clients = await detectClients();
  const selected = await multiselect({
    message: "Select clients to install into",
    options: clients.map((client) => ({
      value: client.id,
      label: client.label,
    })),
    required: true,
  });

  if (typeof selected === "symbol") {
    return;
  }

  for (const clientId of selected) {
    const client = clients.find((item) => item.id === clientId);
    if (!client) {
      continue;
    }
    await installToClient(client.id, client.configPath, install);
    process.stdout.write(
      `${pc.green("Installed")} ${client.label}\n${pc.dim(client.configPath)}\n`
    );
  }
}

export async function runInstallCommand(projectId: string): Promise<void> {
  try {
    await ensureLoggedIn();
    const detail = await apiFetch<{
      install: InstallBundle | null;
    }>(`/api/cli/projects/${projectId}`);

    if (!detail.install) {
      process.stderr.write(`${pc.red("Project is not ready or missing install bundle.")}\n`);
      process.exitCode = 1;
      return;
    }

    await promptInstall(detail.install);
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}
