import { cookies } from "next/headers";
import {
  APP_SESSION_COOKIE,
  appSessionCookieOptions,
  createAppSessionToken,
} from "@/lib/auth/app-session";
import { ensureAppUserFromSupabase } from "@/lib/db/queries";

async function clearSupabaseAuthCookies() {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }
}

export async function startAppSession(input: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const appUser = await ensureAppUserFromSupabase({
    id: input.id,
    email: input.email,
    name: input.name,
    image: input.image,
  });
  const cookieStore = await cookies();
  const token = await createAppSessionToken({
    userId: appUser.id,
    email: appUser.email,
    type: "regular",
  });
  cookieStore.set(APP_SESSION_COOKIE, token, appSessionCookieOptions());
  await clearSupabaseAuthCookies();
}
