import { resolveCliUser } from "@/lib/cli/auth";
import {
  createMcpAccessTokenRow,
  listMcpAccessTokensForUser,
} from "@/lib/db/queries";
import {
  createMcpUserAccessToken,
  hashMcpUserAccessToken,
} from "@/lib/doc2mcp/mcp-user-tokens";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: Request) {
  const cliUser = await resolveCliUser(request);
  if (!cliUser) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const tokens = await listMcpAccessTokensForUser({ userId: cliUser.userId });
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
  const cliUser = await resolveCliUser(request);
  if (!cliUser) {
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
    userId: cliUser.userId,
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
