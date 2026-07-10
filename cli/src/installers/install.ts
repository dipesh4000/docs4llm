import type { CliClient } from "./detect.js";
import {
  mergeMcpServers,
  mergeVscodeMcp,
  readJsonFile,
  writeJsonFile,
} from "./merge.js";

export type InstallPayload = {
  cursor: Record<string, unknown>;
  vscode: Record<string, unknown>;
  windsurf: Record<string, unknown>;
  claude: Record<string, unknown>;
  serverName: string;
};

function unwrapConfig(value: Record<string, unknown>): Record<string, unknown> {
  const nested = value.config;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return value;
}

export async function installToClient(
  client: CliClient,
  configPath: string,
  payload: InstallPayload
): Promise<void> {
  if (client === "cursor") {
    const existing = await readJsonFile(configPath);
    const merged = mergeMcpServers(existing, unwrapConfig(payload.cursor));
    await writeJsonFile(configPath, merged);
    return;
  }

  if (client === "vscode") {
    const existing = await readJsonFile(configPath);
    const merged = mergeVscodeMcp(existing, unwrapConfig(payload.vscode));
    await writeJsonFile(configPath, merged);
    return;
  }

  if (client === "windsurf") {
    const existing = await readJsonFile(configPath);
    const merged = mergeMcpServers(existing, unwrapConfig(payload.windsurf));
    await writeJsonFile(configPath, merged);
    return;
  }

  if (client === "claude") {
    const existing = await readJsonFile(configPath);
    const merged = mergeMcpServers(existing, unwrapConfig(payload.claude));
    await writeJsonFile(configPath, merged);
  }
}
