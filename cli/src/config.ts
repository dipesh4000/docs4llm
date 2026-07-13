import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_API_URL = "https://docs4llm.site";

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
  return join(homedir(), ".docs4llm", "config.json");
}

export function getApiUrl(): string {
  return process.env.DOCS4LLM_API_URL?.replace(/\/$/, "") ?? DEFAULT_API_URL;
}
