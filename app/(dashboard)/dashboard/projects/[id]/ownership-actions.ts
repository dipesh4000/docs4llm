"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/app/(auth)/auth";
import { setProjectCompanyOwnership } from "@/lib/db/queries";

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/;

export type OwnershipResult = { ok: boolean; error?: string };

/**
 * Promote a project to a company MCP (official infrastructure) and attach a
 * custom domain. The domain starts unverified; routing recognizes it only
 * after verification.
 */
export async function updateProjectOwnership(input: {
  projectId: string;
  ownerType: "developer" | "company";
  customDomain: string | null;
}): Promise<OwnershipResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required" };
  }

  const domain = input.customDomain?.trim().toLowerCase() || null;

  if (domain && !DOMAIN_PATTERN.test(domain)) {
    return { ok: false, error: "Enter a valid domain like mcp.acme.com" };
  }

  const updated = await setProjectCompanyOwnership({
    id: input.projectId,
    userId: session.user.id,
    ownerType: input.ownerType,
    teamId: null,
    customDomain: domain,
    customDomainVerified: false,
  });

  if (!updated) {
    return { ok: false, error: "Project not found" };
  }

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  return { ok: true };
}
