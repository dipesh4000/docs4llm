// Compatibility module for Supabase Auth
// Replaces old NextAuth module

export type UserType = "guest" | "regular";

export { createClient as getSupabaseClient } from "@/lib/supabase/server";

import { cookies } from "next/headers";
import { cache } from "react";
import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
} from "@/lib/auth/app-session";
import { guestRegex } from "@/lib/constants";
import { ensureAppUserFromSupabase } from "@/lib/db/queries";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { getSafeUser } from "@/lib/supabase/safe-session";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the current session for this request.
 *
 * Wrapped in React `cache()` so multiple consumers in the same render
 * (layout + page + nav + sub-components) all share a single Supabase
 * round trip + DB sync instead of duplicating them.
 */
export const auth = cache(async () => {
  const cookieStore = await cookies();
  const appSession = await readAppSessionToken(
    cookieStore.get(APP_SESSION_COOKIE)?.value
  );

  if (appSession) {
    if (appSession.type === "guest" || guestRegex.test(appSession.email)) {
      return null;
    }

    try {
      const appUser = await ensureAppUserFromSupabase({
        id: appSession.userId,
        email: appSession.email,
      });

      if (!appUser.disabled && !guestRegex.test(appUser.email)) {
        const userType: UserType = guestRegex.test(appUser.email)
          ? "guest"
          : appSession.type;
        return {
          user: {
            id: appUser.id,
            email: appUser.email,
            name: appUser.name ?? undefined,
            image: appUser.image ?? undefined,
            type: userType,
          },
        };
      }
    } catch {
      // Stale or corrupt app session — fall through to Supabase below.
    }
  }

  if (!isSupabasePublicConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const user = await getSafeUser(supabase);

  if (!user) {
    return null;
  }

  // Anonymous Supabase users have no email — synthesize a stable, digit-only
  // guest identifier (matches `guestRegex`) in older sessions. Guest mode has
  // been removed, so anonymous Supabase users are treated as logged out.
  const isAnonymous = user.is_anonymous === true || !user.email;
  if (isAnonymous) {
    return null;
  }

  const email =
    user.email && user.email.length > 0
      ? user.email
      : `guest-${user.id.replace(/\D/g, "").slice(0, 15) || Date.now().toString()}`;

  let appUser: Awaited<ReturnType<typeof ensureAppUserFromSupabase>>;
  try {
    appUser = await ensureAppUserFromSupabase({
      id: user.id,
      email,
      name: isAnonymous ? null : user.user_metadata?.name,
      image: isAnonymous
        ? null
        : (user.user_metadata?.avatar_url ?? user.user_metadata?.image),
    });
  } catch (error) {
    if (process.env.VERCEL_ENV !== "preview") {
      throw error;
    }

    const userType: UserType = guestRegex.test(email) ? "guest" : "regular";

    return {
      user: {
        id: user.id,
        email,
        name: isAnonymous ? undefined : user.user_metadata?.name,
        image: isAnonymous
          ? undefined
          : (user.user_metadata?.avatar_url ?? user.user_metadata?.image),
        type: userType,
      },
    };
  }

  if (appUser.disabled) {
    return null;
  }

  const userType: UserType = guestRegex.test(appUser.email)
    ? "guest"
    : "regular";

  return {
    user: {
      id: appUser.id,
      email: appUser.email,
      name: appUser.name ?? user.user_metadata?.name,
      image: appUser.image ?? user.user_metadata?.image,
      type: userType,
    },
  };
});
