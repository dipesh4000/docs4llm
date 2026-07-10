import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  clearAppSessionCookieOptions,
  clearSupabaseAuthCookiesOnResponse,
  readAppSessionToken,
} from "@/lib/auth/app-session";
import { guestRegex } from "@/lib/constants";
import {
  getSupabasePublicEnv,
  isSupabasePublicConfigured,
} from "@/lib/supabase/env";
import { getSafeUser } from "@/lib/supabase/safe-session";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const appSession = await readAppSessionToken(
    request.cookies.get(APP_SESSION_COOKIE)?.value
  );
  if (appSession) {
    if (appSession.type === "guest" || guestRegex.test(appSession.email)) {
      supabaseResponse.cookies.set(
        APP_SESSION_COOKIE,
        "",
        clearAppSessionCookieOptions()
      );
      clearSupabaseAuthCookiesOnResponse(request, supabaseResponse);
      return { supabaseResponse, user: null };
    }

    clearSupabaseAuthCookiesOnResponse(request, supabaseResponse);
    return {
      supabaseResponse,
      user: {
        id: appSession.userId,
        email: appSession.email,
        is_anonymous: false,
      },
    };
  }

  if (!isSupabasePublicConfigured()) {
    return { supabaseResponse, user: null };
  }

  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        supabaseResponse = NextResponse.next({
          request,
        });

        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  const user = await getSafeUser(supabase);
  if (
    user?.is_anonymous === true ||
    !user?.email ||
    guestRegex.test(user.email)
  ) {
    supabaseResponse.cookies.set(
      APP_SESSION_COOKIE,
      "",
      clearAppSessionCookieOptions()
    );
    clearSupabaseAuthCookiesOnResponse(request, supabaseResponse);
    return { supabaseResponse, user: null };
  }

  // Do NOT mint an app session here. Supabase user.id can differ from the
  // canonical app `User.id` when the same email already exists (see
  // ensureAppUserFromSupabase). OAuth/email confirm routes call
  // startAppSession() which resolves the correct id. Creating a session
  // here caused /api/projects/:id polls to 404 mid-conversion.

  return { supabaseResponse, user };
}
