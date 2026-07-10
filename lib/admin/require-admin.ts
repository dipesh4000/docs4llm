import "server-only";

import { auth } from "@/app/(auth)/auth";
import { isAdminEmail } from "@/lib/admin/admin-access";

export async function requireAdmin() {
  const session = await auth();

  if (!isAdminEmail(session?.user?.email)) {
    return null;
  }

  return session;
}
