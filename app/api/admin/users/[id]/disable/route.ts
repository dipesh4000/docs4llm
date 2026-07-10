import { requireAdmin } from "@/lib/admin/require-admin";
import {
  disableUser,
  getUserById,
} from "@/lib/db/queries";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
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

    const supabase = createSupabaseAdmin();
    await supabase.auth.admin.updateUserById(id, {
      ban_duration: "876000h",
    });

    await disableUser(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin disable user:", error);
    return Response.json({ error: "Disable failed" }, { status: 500 });
  }
}
