import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type CliClient = "cursor" | "vscode" | "claude" | "windsurf";

export type DetectedClient = {
  id: CliClient;
  label: string;
  configPath: string;
};

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectClients(): Promise<DetectedClient[]> {
  const home = homedir();
  const detected: DetectedClient[] = [];

  const cursorGlobal = join(home, ".cursor", "mcp.json");
  const cursorProject = join(process.cwd(), ".cursor", "mcp.json");
  if ((await exists(cursorGlobal)) || (await exists(join(home, ".cursor")))) {
    detected.push({
      id: "cursor",
      label: "Cursor (global ~/.cursor/mcp.json)",
      configPath: cursorGlobal,
    });
  } else if (await exists(cursorProject)) {
    detected.push({
      id: "cursor",
      label: "Cursor (project .cursor/mcp.json)",
      configPath: cursorProject,
    });
  } else {
    detected.push({
      id: "cursor",
      label: "Cursor (~/.cursor/mcp.json)",
      configPath: cursorGlobal,
    });
  }

  const vscodeProject = join(process.cwd(), ".vscode", "mcp.json");
  detected.push({
    id: "vscode",
    label: "VS Code (workspace .vscode/mcp.json)",
    configPath: vscodeProject,
  });

  const windsurf = join(home, ".codeium", "windsurf", "mcp_config.json");
  if ((await exists(windsurf)) || (await exists(join(home, ".codeium")))) {
    detected.push({
      id: "windsurf",
      label: "Windsurf",
      configPath: windsurf,
    });
  }

  const claudeMac = join(
    home,
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json"
  );
  const claudeWin = join(
    home,
    "AppData",
    "Roaming",
    "Claude",
    "claude_desktop_config.json"
  );
  let claudePath = join(home, ".config", "Claude", "claude_desktop_config.json");
  if (process.platform === "win32") {
    claudePath = claudeWin;
  } else if (process.platform === "darwin") {
    claudePath = claudeMac;
  }

  if ((await exists(claudePath)) || process.platform === "darwin") {
    detected.push({
      id: "claude",
      label: "Claude Desktop",
      configPath: claudePath,
    });
  }

  return detected;
}
