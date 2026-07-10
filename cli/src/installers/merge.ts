import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function readJsonFile(path: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export async function writeJsonFile(
  path: string,
  value: Record<string, unknown>
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function mergeMcpServers(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const currentServers =
    existing.mcpServers && typeof existing.mcpServers === "object"
      ? (existing.mcpServers as Record<string, unknown>)
      : {};
  const incomingServers =
    incoming.mcpServers && typeof incoming.mcpServers === "object"
      ? (incoming.mcpServers as Record<string, unknown>)
      : incoming;

  return {
    ...existing,
    mcpServers: {
      ...currentServers,
      ...incomingServers,
    },
  };
}

export function mergeVscodeMcp(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const currentServers =
    existing.servers && typeof existing.servers === "object"
      ? (existing.servers as Record<string, unknown>)
      : {};
  const incomingServers =
    incoming.servers && typeof incoming.servers === "object"
      ? (incoming.servers as Record<string, unknown>)
      : {};

  return {
    ...existing,
    servers: {
      ...currentServers,
      ...incomingServers,
    },
  };
}
