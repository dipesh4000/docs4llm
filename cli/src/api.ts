import pc from "picocolors";
import { loadConfig } from "./store.js";
import { getApiUrl } from "./config.js";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const config = await loadConfig();
  const baseUrl = config.apiUrl || getApiUrl();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const needsAuth = options.auth !== false;
  if (needsAuth) {
    if (!config.token) {
      throw new ApiError("Not logged in. Run: doc2mcp login", 401, null);
    }
    headers.set("Authorization", `Bearer ${config.token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const body = await parseJson(response);
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export function printError(error: unknown): void {
  if (error instanceof ApiError) {
    process.stderr.write(`${pc.red("Error:")} ${error.message}\n`);
    return;
  }
  if (error instanceof Error) {
    process.stderr.write(`${pc.red("Error:")} ${error.message}\n`);
    return;
  }
  process.stderr.write(`${pc.red("Error:")} Unknown error\n`);
}
