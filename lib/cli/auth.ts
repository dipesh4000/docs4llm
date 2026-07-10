import "server-only";

import { hashPat, readCliAuthToken, verifyPat } from "@/lib/cli/tokens";
import {
  getCliTokenByHash,
  getUserById,
  touchCliTokenLastUsed,
} from "@/lib/db/queries";

export type ResolvedCliUser = {
  userId: string;
  tokenId: string;
  email: string;
  name: string | null;
};

export async function resolveCliUser(
  request: Request
): Promise<ResolvedCliUser | null> {
  const token = readCliAuthToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = hashPat(token);
  const row = await getCliTokenByHash({ tokenHash });
  if (!row || row.revokedAt) {
    return null;
  }

  if (!verifyPat(token, row.tokenHash)) {
    return null;
  }

  const appUser = await getUserById(row.userId);
  if (!appUser || appUser.disabled) {
    return null;
  }

  await touchCliTokenLastUsed({ id: row.id });

  return {
    userId: row.userId,
    tokenId: row.id,
    email: appUser.email,
    name: appUser.name,
  };
}
