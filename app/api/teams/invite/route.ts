import { auth } from "@/app/(auth)/auth";
import {
  createTeamInvite,
  getOrCreateOwnedTeam,
  listTeamInvitesForOwner,
} from "@/lib/db/queries";
import { getDoc2McpBaseUrl } from "@/lib/doc2mcp/app-url";

/**
 * Team invites are owner-scoped only:
 * - Session must be a signed-in non-guest user
 * - Workspace is the caller's owned team (get-or-create personal workspace)
 * - createTeamInvite re-checks Team.ownerId === invitedBy before insert
 * - Client never supplies teamId (IDOR-safe)
 */
async function requireSignedInUser() {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return {
      error: Response.json({ error: "unauthorized" }, { status: 401 }),
    } as const;
  }
  return { session } as const;
}

async function resolveOwnedWorkspace(userId: string, email?: string | null) {
  const ownedTeam = await getOrCreateOwnedTeam({ userId, email });
  if (!ownedTeam || ownedTeam.ownerId !== userId) {
    return null;
  }
  return ownedTeam;
}

export async function GET() {
  const authResult = await requireSignedInUser();
  if ("error" in authResult) {
    return authResult.error;
  }
  const { session } = authResult;

  const ownedTeam = await resolveOwnedWorkspace(
    session.user.id,
    session.user.email
  );
  if (!ownedTeam) {
    return Response.json(
      {
        error: "forbidden",
        message: "Only the workspace owner can view invites.",
      },
      { status: 403 }
    );
  }

  const invites = await listTeamInvitesForOwner({ userId: session.user.id });

  return Response.json({
    team: {
      id: ownedTeam.id,
      name: ownedTeam.name,
      slug: ownedTeam.slug,
      ownerId: ownedTeam.ownerId,
    },
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireSignedInUser();
  if ("error" in authResult) {
    return authResult.error;
  }
  const { session } = authResult;

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: "admin" | "member";
  };
  const email = body.email?.trim().toLowerCase();
  if (!email?.includes("@")) {
    return Response.json(
      { error: "invalid_email", message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const sessionEmail = (session.user.email ?? "").trim().toLowerCase();
  if (email === sessionEmail) {
    return Response.json(
      {
        error: "invalid_email",
        message: "You cannot invite your own account.",
      },
      { status: 400 }
    );
  }

  // Basic RFC-ish check — enough to reject obvious garbage before DB write.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: "invalid_email", message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const ownedTeam = await resolveOwnedWorkspace(
    session.user.id,
    session.user.email
  );
  if (!ownedTeam) {
    return Response.json(
      {
        error: "forbidden",
        message: "Only the workspace owner can create invites.",
      },
      { status: 403 }
    );
  }

  try {
    const { invite, rawToken } = await createTeamInvite({
      teamId: ownedTeam.id,
      email,
      invitedBy: session.user.id,
      role: body.role === "admin" ? "admin" : "member",
    });

    const acceptUrl = `${getDoc2McpBaseUrl()}/dashboard/settings?invite=${rawToken}`;

    return Response.json({
      invite: {
        id: invite?.id,
        email: invite?.email,
        status: invite?.status,
        expiresAt: invite?.expiresAt,
      },
      acceptUrl,
      note: "Email delivery is not wired yet — share this accept link with your teammate.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("conflict:")) {
      return Response.json(
        {
          error: "conflict",
          message: "A pending invite already exists for this email.",
        },
        { status: 409 }
      );
    }
    return Response.json(
      {
        error: "forbidden",
        message: "Only the workspace owner can create invites.",
      },
      { status: 403 }
    );
  }
}
