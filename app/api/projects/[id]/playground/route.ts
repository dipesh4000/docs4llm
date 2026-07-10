import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getPlatformProjectById } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import type { ProjectArtifacts } from "@/types/platform";

const bodySchema = z.object({
  tool: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const { id } = await params;
  const project = await getPlatformProjectById({
    id,
    userId: session.user.id,
  });

  if (!project) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const artifacts = project.artifacts as ProjectArtifacts | null;
  const token = artifacts?.mcpAccessToken;
  if (!token) {
    return Response.json(
      { error: "MCP token is not available for this project yet." },
      { status: 400 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Invalid playground request" },
      { status: 400 }
    );
  }

  const mcpResponse = await fetch(new URL(`/api/mcp/${id}/mcp`, request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Doc2MCP-Token": token,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "playground-call",
      method: "tools/call",
      params: {
        name: body.tool,
        arguments: body.arguments,
      },
    }),
  });

  const text = await mcpResponse.text();
  return new Response(text, {
    status: mcpResponse.status,
    headers: {
      "Content-Type":
        mcpResponse.headers.get("Content-Type") ??
        "application/json; charset=utf-8",
    },
  });
}
