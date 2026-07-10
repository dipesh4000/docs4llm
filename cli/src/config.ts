import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_API_URL = "https://doc2mcp.site";

export type CliConfig = {
  apiUrl: string;
  token?: string;
  /** User MCP access token for marketplace installs (`d2mcp_usr_…`). */
  mcpAccessToken?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};

export function getConfigPath(): string {
  return join(homedir(), ".doc2mcp", "config.json");
}

export function getApiUrl(): string {
  return process.env.DOC2MCP_API_URL?.replace(/\/$/, "") ?? DEFAULT_API_URL;
}
