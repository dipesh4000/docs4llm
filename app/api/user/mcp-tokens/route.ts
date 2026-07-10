import { auth } from "@/app/(auth)/auth";
import {
  createMcpAccessTokenRow,
  listMcpAccessTokensForUser,
} from "@/lib/db/queries";
import {
  createMcpUserAccessToken,
  hashMcpUserAccessToken,
} from "@/lib/doc2mcp/mcp-user-tokens";
import { ChatbotError } from "@/lib/errors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const tokens = await listMcpAccessTokensForUser({ userId: session.user.id });
  return Response.json({
    tokens: tokens.map((token) => ({
      id: token.id,
      name: token.name,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
      revokedAt: token.revokedAt,
      active: token.revokedAt === null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  let name = "Marketplace";
  try {
    const body = (await request.json()) as { name?: string };
    if (body.name?.trim()) {
      name = body.name.trim().slice(0, 120);
    }
  } catch {
    // optional body
  }

  const plaintext = createMcpUserAccessToken();
  const row = await createMcpAccessTokenRow({
    userId: session.user.id,
    tokenHash: hashMcpUserAccessToken(plaintext),
    name,
  });

  return Response.json({
    token: {
      id: row.id,
      name: row.name,
      plaintext,
      createdAt: row.createdAt,
    },
  });
}
