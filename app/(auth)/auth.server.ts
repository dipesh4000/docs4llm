import { cookies } from "next/headers";
import {
  APP_SESSION_COOKIE,
  clearAppSessionCookieOptions,
} from "@/lib/auth/app-session";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getSession() {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.set(APP_SESSION_COOKIE, "", clearAppSessionCookieOptions());
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }

  if (!isSupabasePublicConfigured()) {
    return;
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
}
