import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const USER_TOKEN_PREFIX = "d2mcp_usr_";

export function createMcpUserAccessToken(): string {
  return `${USER_TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function hashMcpUserAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isMcpUserAccessToken(token: string | null): boolean {
  return Boolean(token?.startsWith(USER_TOKEN_PREFIX));
}

export function verifyMcpUserAccessToken(
  provided: string | null,
  storedHash: string | undefined
): boolean {
  if (!provided || !storedHash || !isMcpUserAccessToken(provided)) {
    return false;
  }
  const a = Buffer.from(hashMcpUserAccessToken(provided), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  return timingSafeEqual(a, b);
}
