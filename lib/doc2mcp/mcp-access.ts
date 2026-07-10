import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createMcpProjectToken(): string {
  return `d2mcp_${randomBytes(24).toString("base64url")}`;
}

export function hashMcpToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Constant-time MCP token verification.
 *
 * Uses `crypto.timingSafeEqual` on equal-length hex buffers to prevent
 * byte-by-byte timing oracles. Returns false on any malformed input rather
 * than throwing — callers should treat false as a 401.
 */
export function verifyMcpToken(
  provided: string | null,
  storedHash: string | undefined
): boolean {
  if (!provided || !storedHash) {
    return false;
  }
  const a = Buffer.from(hashMcpToken(provided), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Read the MCP project token from a request.
 *
 * Accepts:
 *   - `Authorization: Bearer <token>` (preferred, used by Cursor/Claude)
 *   - `X-Doc2MCP-Token: <token>` (legacy header, kept for clients that can't
 *     set Authorization)
 *
 * Query-string tokens (`?token=...`) are **NOT** accepted because they leak
 * through access logs, OTel attributes, browser history, and Referer headers.
 */
export function readMcpAuthToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  const xToken = request.headers.get("x-doc2mcp-token");
  if (xToken) {
    return xToken.trim();
  }
  return null;
}
