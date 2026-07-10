import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PAT_PREFIX = "d2mcp_pat_";
const DEVICE_CODE_BYTES = 32;
const USER_CODE_LENGTH = 8;
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createPat(): string {
  return `${PAT_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function createDeviceCode(): string {
  return randomBytes(DEVICE_CODE_BYTES).toString("base64url");
}

export function createUserCode(): string {
  const bytes = randomBytes(USER_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < USER_CODE_LENGTH; i++) {
    code += USER_CODE_ALPHABET[bytes[i] % USER_CODE_ALPHABET.length];
  }
  return code;
}

export function hashPat(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Hash arbitrary secrets (device codes, etc.). */
export function hashSecret(value: string): string {
  return hashPat(value);
}

export function verifyPat(
  provided: string | null,
  storedHash: string | undefined
): boolean {
  if (!provided || !storedHash) {
    return false;
  }
  if (!provided.startsWith(PAT_PREFIX)) {
    return false;
  }
  const a = Buffer.from(hashPat(provided), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function readCliAuthToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    if (token.startsWith(PAT_PREFIX)) {
      return token;
    }
  }
  return null;
}

export const CLI_AUTH_POLL_INTERVAL_SECONDS = 2;
export const CLI_AUTH_EXPIRY_MINUTES = 15;
