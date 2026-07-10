import type { NextRequest, NextResponse } from "next/server";

export type AppSession = {
  userId: string;
  email: string;
  type: "guest" | "regular";
  expiresAt: number;
};

export const APP_SESSION_COOKIE = "doc2mcp_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET for app session cookies.");
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const normalized = padded.padEnd(
    padded.length + ((4 - (padded.length % 4)) % 4),
    "="
  );
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getAesKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(getSessionSecret())
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function createAppSessionToken(
  input: Omit<AppSession, "expiresAt">
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = {
    ...input,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const key = await getAesKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload))
  );

  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

export async function readAppSessionToken(
  token: string | undefined
): Promise<AppSession | null> {
  if (!token) {
    return null;
  }

  const [ivPart, encryptedPart] = token.split(".");
  if (!(ivPart && encryptedPart)) {
    return null;
  }

  try {
    const key = await getAesKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlDecode(ivPart) },
      key,
      base64UrlDecode(encryptedPart)
    );
    const parsed = JSON.parse(decoder.decode(decrypted)) as AppSession;
    if (
      !parsed.userId ||
      !parsed.email ||
      !parsed.expiresAt ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function appSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function clearAppSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function supabaseAuthCookieNames(request: NextRequest): string[] {
  return request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-"));
}

export function clearSupabaseAuthCookiesOnResponse(
  request: NextRequest,
  response: NextResponse
) {
  for (const name of supabaseAuthCookieNames(request)) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  }
}
