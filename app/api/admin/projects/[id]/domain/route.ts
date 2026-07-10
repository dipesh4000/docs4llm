import { requireAdmin } from "@/lib/admin/require-admin";
import { adminSetProjectCustomDomain } from "@/lib/db/queries";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: { customDomain?: string | null; customDomainVerified?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const domain =
    body.customDomain === null || body.customDomain === undefined
      ? null
      : String(body.customDomain).trim().toLowerCase();

  if (
    domain &&
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
      domain
    )
  ) {
    return Response.json({ error: "Invalid domain format" }, { status: 400 });
  }

  const updated = await adminSetProjectCustomDomain({
    projectId: id,
    customDomain: domain,
    customDomainVerified: Boolean(body.customDomainVerified),
  });

  if (!updated) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({
    project: {
      id: updated.id,
      name: updated.name,
      customDomain: updated.customDomain,
      customDomainVerified: updated.customDomainVerified,
    },
  });
}
