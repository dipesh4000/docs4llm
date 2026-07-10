import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { updateUserName } from "@/lib/db/queries";

const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Name is too long (max 80 characters).")
    .nullable()
    .or(z.literal("")),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const nextName =
    parsed.data.name && parsed.data.name.length > 0 ? parsed.data.name : null;

  try {
    const updated = await updateUserName(session.user.id, nextName);
    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({
      ok: true,
      name: updated.name,
    });
  } catch (error) {
    console.error("Profile name update failed:", error);
    return Response.json({ error: "Failed to update name" }, { status: 500 });
  }
}
