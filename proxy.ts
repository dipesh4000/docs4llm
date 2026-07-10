import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth",
  "/post-login",
  "/pricing",
  "/demo",
  "/blog",
  "/contact",
  "/privacy-policy",
  "/refund-policy",
  "/terms-and-conditions",
  "/api/auth",
  "/api/contact",
  "/ping",
  "/docs",
  "/api/mcp",
];

const AUTH_PAGES = ["/login", "/register"];

const GUEST_EMAIL_REGEX = /^guest-\d+$/;

/**
 * A "real" authenticated user — i.e. a regular account, not an anonymous /
 * guest session. Guests get a synthesized `guest-…` email and must be treated
 * as logged out for protected areas (dashboard, admin) and auth pages.
 */
function isAuthenticatedUser(
  user: { email?: string | null; is_anonymous?: boolean } | null
): boolean {
  if (!user || user.is_anonymous === true) {
    return false;
  }
  if (!user.email || GUEST_EMAIL_REGEX.test(user.email)) {
    return false;
  }
  return true;
}

function splitEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const configured = [
    ...splitEmails(process.env.ADMIN_EMAILS),
    ...splitEmails(process.env.ADMIN_EMAIL),
    ...splitEmails(process.env.NEXT_PUBLIC_ADMIN_EMAIL),
  ];
  const adminEmails =
    configured.length > 0 ? configured : ["doc2mcp@gmail.com"];

  return adminEmails.includes(email.toLowerCase());
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    /\.(?:png|jpe?g|gif|webp|svg|ico|txt|xml|woff2?|ttf|eot|mp4|webm)$/i.test(
      pathname
    )
  );
}

const CURRENCY_COOKIE = "d2m_currency";

/**
 * Set a `d2m_currency` cookie based on the geo header Vercel/Cloudflare set
 * on the request, so the pricing UI can render server-correct prices on the
 * very first paint. Skipped when the user has already picked a currency.
 */
function setCurrencyHintIfMissing(
  request: NextRequest,
  response: NextResponse
) {
  if (request.cookies.get(CURRENCY_COOKIE)) {
    return;
  }
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    "";
  const currency = country.toUpperCase() === "IN" ? "INR" : "USD";
  response.cookies.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/**
 * Apply baseline security headers to every response. Cheap insurance that
 * blocks clickjacking, mime sniffing, and unnecessary referrer leakage.
 */
function applySecurityHeaders(response: NextResponse) {
  const headers = response.headers;
  if (!headers.has("X-Content-Type-Options")) {
    headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!headers.has("X-Frame-Options")) {
    headers.set("X-Frame-Options", "DENY");
  }
  if (!headers.has("Referrer-Policy")) {
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  if (!headers.has("Permissions-Policy")) {
    headers.set(
      "Permissions-Policy",
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    !headers.has("Strict-Transport-Security")
  ) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  // Strip framework fingerprints. They give attackers free recon.
  headers.delete("X-Powered-By");
  headers.delete("Server");
}

function safePostLoginPath(raw: string | null): string {
  if (!raw?.startsWith("/")) {
    return "/post-login";
  }
  if (raw.startsWith("//") || raw.startsWith("/auth/")) {
    return "/post-login";
  }
  return raw;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next({ request });
  }

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // Supabase PKCE sometimes redirects to Site URL (/) with ?code= when the
  // exact redirectTo path is not allow-listed. Forward to /auth/oauth so the
  // server can exchange the code and mint the app session.
  const oauthCode = request.nextUrl.searchParams.get("code");
  if (
    oauthCode &&
    !pathname.startsWith("/auth/oauth") &&
    !pathname.startsWith("/auth/confirm")
  ) {
    const oauthUrl = new URL(`${base}/auth/oauth`, request.url);
    oauthUrl.searchParams.set("code", oauthCode);
    const next = safePostLoginPath(request.nextUrl.searchParams.get("next"));
    oauthUrl.searchParams.set("next", next);
    const redirect = NextResponse.redirect(oauthUrl);
    applySecurityHeaders(redirect);
    return redirect;
  }

  if (pathname === "/register") {
    const loginUrl = new URL(`${base}/login`, request.url);
    const redirectUrl = request.nextUrl.searchParams.get("redirectUrl");
    if (redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")) {
      loginUrl.searchParams.set("redirectUrl", redirectUrl);
    }
    const redirect = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirect);
    return redirect;
  }

  // Hot path: MCP tool calls authenticate via bearer token inside the route
  // handler (resolveMcpProject → verifyMcpToken). Running Supabase session
  // refresh here adds 150-400ms per call for zero benefit, since the MCP
  // bearer token is the source of truth. Skip middleware entirely.
  if (pathname.startsWith("/api/mcp/")) {
    const response = NextResponse.next({ request });
    applySecurityHeaders(response);
    return response;
  }

  const { supabaseResponse, user } = await updateSession(request);

  setCurrencyHintIfMissing(request, supabaseResponse);
  applySecurityHeaders(supabaseResponse);

  const isAuthed = isAuthenticatedUser(user);

  if (isPublicPath(pathname)) {
    if (isAuthed && AUTH_PAGES.includes(pathname)) {
      const redirect = NextResponse.redirect(new URL(`${base}/`, request.url));
      applySecurityHeaders(redirect);
      return redirect;
    }

    return supabaseResponse;
  }

  if (
    pathname.startsWith("/admin") &&
    (!isAuthed || !isAdminEmail(user?.email))
  ) {
    const redirect = NextResponse.redirect(
      new URL(`${base}/login`, request.url)
    );
    applySecurityHeaders(redirect);
    return redirect;
  }

  if (
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/chat") ||
      pathname.startsWith("/convert")) &&
    !isAuthed
  ) {
    const redirectUrl = new URL(`${base}/login`, request.url);
    redirectUrl.searchParams.set("redirectUrl", pathname);
    const redirect = NextResponse.redirect(redirectUrl);
    applySecurityHeaders(redirect);
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  // Run on everything EXCEPT Next internals (`_next/*`, which includes RSC /
  // segment payloads and prefetches), the favicon, sitemap/robots, and static
  // asset files (now also css/js/map). Each of those previously invoked the
  // middleware and added Active CPU on every hit for zero benefit. Pages and
  // all `/api/*` routes (incl. `/api/auth`, `/api/mcp`, protected pages) still
  // run middleware exactly as before — auth and routing are unchanged.
  matcher: [
    "/((?!_next/|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map|txt|xml|woff2?|ttf|eot|mp4|webm)$).*)",
  ],
};
