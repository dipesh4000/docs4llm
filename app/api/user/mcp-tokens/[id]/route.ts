import { auth } from "@/app/(auth)/auth";
import { revokeMcpAccessToken } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const { id } = await params;
  const row = await revokeMcpAccessToken({ id, userId: session.user.id });
  if (!row) {
    return new ChatbotError("not_found:document").toResponse();
  }

  return Response.json({ ok: true });
}
