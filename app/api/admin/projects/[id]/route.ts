import { requireAdmin } from "@/lib/admin/require-admin";
import { hardDeleteProject } from "@/lib/db/queries";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await hardDeleteProject(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin delete project:", error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
