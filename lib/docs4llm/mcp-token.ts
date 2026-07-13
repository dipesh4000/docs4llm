import { createHash, randomBytes } from "node:crypto";

export function generateMcpAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashMcpAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyMcpAccessToken(
  token: string,
  storedHash: string | undefined
): boolean {
  if (!storedHash || !token) {
    return false;
  }
  return hashMcpAccessToken(token) === storedHash;
}
