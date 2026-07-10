import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getUserById,
  hardDeleteUser,
} from "@/lib/db/queries";

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
    const dbUser = await getUserById(id);
    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await hardDeleteUser(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin delete user:", error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
