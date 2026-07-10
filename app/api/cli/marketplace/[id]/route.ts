import { resolveCliUser } from "@/lib/cli/auth";
import { buildCliMarketplaceInstallBundle } from "@/lib/cli/marketplace-install";
import {
  createMcpAccessTokenRow,
  getMarketplaceProjectById,
} from "@/lib/db/queries";
import {
  createMcpUserAccessToken,
  hashMcpUserAccessToken,
} from "@/lib/doc2mcp/mcp-user-tokens";
import { ChatbotError } from "@/lib/errors";

function resolveUserMcpToken(provided?: string | null): string | null {
  if (provided?.startsWith("d2mcp_usr_")) {
    return provided;
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cliUser = await resolveCliUser(request);
  if (!cliUser) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const { id } = await params;
  const row = await getMarketplaceProjectById(id);
  if (!row) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const url = new URL(request.url);
  const userToken = resolveUserMcpToken(url.searchParams.get("mcpToken"));

  if (!userToken) {
    const preview = buildCliMarketplaceInstallBundle(
      row.artifacts,
      "d2mcp_usr_PLACEHOLDER"
    );
    return Response.json({
      project: { id: row.id, name: row.name, sourceUrl: row.sourceUrl },
      needsToken: true,
      endpointUrl: preview?.endpointUrl ?? null,
      serverName: preview?.serverName ?? null,
      message: "Run: doc2mcp token create",
    });
  }

  const install = buildCliMarketplaceInstallBundle(row.artifacts, userToken);
  if (!install) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  return Response.json({
    project: { id: row.id, name: row.name, sourceUrl: row.sourceUrl },
    install,
    mcp: {
      url: install.endpointUrl,
      token: userToken,
      serverName: install.serverName,
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cliUser = await resolveCliUser(_request);
  if (!cliUser) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const { id } = await params;
  const row = await getMarketplaceProjectById(id);
  if (!row) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const plaintext = createMcpUserAccessToken();
  await createMcpAccessTokenRow({
    userId: cliUser.userId,
    tokenHash: hashMcpUserAccessToken(plaintext),
    name: "CLI Marketplace",
  });

  const install = buildCliMarketplaceInstallBundle(row.artifacts, plaintext);
  if (!install) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  return Response.json({
    project: { id: row.id, name: row.name, sourceUrl: row.sourceUrl },
    install,
    mcp: {
      url: install.endpointUrl,
      token: plaintext,
      serverName: install.serverName,
    },
    createdToken: plaintext,
  });
}
