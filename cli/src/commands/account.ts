import pc from "picocolors";
import { clearConfigToken, loadConfig } from "../store.js";

export async function runLogout(): Promise<void> {
  await clearConfigToken();
  process.stdout.write(`${pc.green("Logged out.")}\n`);
}

export async function runWhoami(): Promise<void> {
  const config = await loadConfig();
  if (!config.token || !config.user) {
    process.stdout.write(`${pc.yellow("Not logged in.")} Run ${pc.bold("doc2mcp login")}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${pc.bold(config.user.email)}\n`);
  if (config.user.name) {
    process.stdout.write(`${pc.dim(config.user.name)}\n`);
  }
  process.stdout.write(`${pc.dim(`API: ${config.apiUrl}`)}\n`);
}
