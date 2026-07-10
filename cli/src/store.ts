import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type CliConfig,
  getApiUrl,
  getConfigPath,
} from "./config.js";

export async function loadConfig(): Promise<CliConfig> {
  try {
    const raw = await readFile(getConfigPath(), "utf8");
    const parsed = JSON.parse(raw) as CliConfig;
    return {
      apiUrl: parsed.apiUrl || getApiUrl(),
      token: parsed.token,
      mcpAccessToken: parsed.mcpAccessToken,
      user: parsed.user,
    };
  } catch {
    return { apiUrl: getApiUrl() };
  }
}

export async function saveConfig(config: CliConfig): Promise<void> {
  const path = getConfigPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function clearConfigToken(): Promise<void> {
  const config = await loadConfig();
  await saveConfig({
    apiUrl: config.apiUrl,
  });
}
