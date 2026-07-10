"use server";

import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { createPat, hashPat } from "@/lib/cli/tokens";
import {
  approveCliAuthRequest,
  createCliToken,
  getCliAuthRequestByUserCode,
} from "@/lib/db/queries";

export type ApproveCliAuthState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function approveCliAuth(
  _prev: ApproveCliAuthState,
  formData: FormData
): Promise<ApproveCliAuthState> {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  const userCode = String(formData.get("userCode") ?? "")
    .trim()
    .toUpperCase();
  if (!userCode) {
    return { status: "error", message: "Missing authorization code." };
  }

  const requestRow = await getCliAuthRequestByUserCode({ userCode });
  if (!requestRow) {
    return { status: "error", message: "Authorization request not found." };
  }

  if (requestRow.expiresAt.getTime() < Date.now()) {
    return { status: "error", message: "This authorization request expired." };
  }

  if (requestRow.status !== "pending") {
    return {
      status: "error",
      message: "This authorization request was already handled.",
    };
  }

  const rawPat = createPat();
  const tokenRow = await createCliToken({
    userId: session.user.id,
    tokenHash: hashPat(rawPat),
    name: "doc2mcp CLI",
  });

  await approveCliAuthRequest({
    id: requestRow.id,
    userId: session.user.id,
    cliTokenId: tokenRow.id,
    issuedTokenPlaintext: rawPat,
  });

  return {
    status: "success",
    message:
      "CLI authorized. You can close this tab and return to your terminal.",
  };
}
