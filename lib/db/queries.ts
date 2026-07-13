import "server-only";

import { createHash } from "node:crypto";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  ne,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import { generateUUID } from "../utils";
import { db } from "./client";
import {
  aiWorkflow,
  type Chat,
  chat,
  cliAuthRequest,
  cliToken,
  type DBMessage,
  document,
  mcpAccessToken,
  mcpHit,
  mcpServer,
  message,
  type PlatformProject,
  platformProject,
  type Suggestion,
  stream,
  suggestion,
  team,
  teamInvite,
  teamMember,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function getUserById(id: string) {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function getOrCreateOAuthUser(
  email: string,
  name: string,
  image: string
) {
  try {
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (existingUser.length > 0) {
      return existingUser[0];
    }

    const result = await db
      .insert(user)
      .values({ email, name, image, emailVerified: true })
      .returning();

    return result[0];
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get or create OAuth user"
    );
  }
}

const TRANSIENT_DB_CODES = new Set([
  "CONNECT_TIMEOUT",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && TRANSIENT_DB_CODES.has(code);
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function runWithDbRetry<T>(
  task: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 200,
  }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await task();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransientDbError(err)) {
        break;
      }
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastErr;
}

export async function ensureAppUserFromSupabase({
  id,
  email,
  name,
  image,
}: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  try {
    return await runWithDbRetry(async () => {
      const byId = await db.select().from(user).where(eq(user.id, id));
      if (byId.length > 0) {
        return byId[0];
      }

      const byEmail = await db.select().from(user).where(eq(user.email, email));
      if (byEmail.length > 0) {
        return byEmail[0];
      }

      const [created] = await db
        .insert(user)
        .values({
          id,
          email,
          name: name ?? null,
          image: image ?? null,
          emailVerified: true,
        })
        .returning();

      return created;
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
    console.error(`ensureAppUserFromSupabase failed (code=${code})`);
    throw new ChatbotError(
      "bad_request:database",
      "Failed to sync Supabase user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<unknown>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save document");
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const latest = docs[0];
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (_error) {
    if (_error instanceof ChatbotError) {
      throw _error;
    }
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update document content"
    );
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (_error) {
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

export async function createPlatformProject({
  userId,
  name,
  sourceUrl,
  sourceType,
  source = "web",
}: {
  userId: string;
  name: string;
  sourceUrl?: string;
  sourceType: PlatformProject["sourceType"];
  source?: PlatformProject["source"];
}) {
  const [project] = await db
    .insert(platformProject)
    .values({
      userId,
      name,
      sourceUrl,
      sourceType,
      source,
      status: "pending",
      logs: [],
    })
    .returning();
  return project;
}

// biome-ignore lint/suspicious/useAwait: drizzle query returns a thenable promise
export async function getPlatformProjectsByUserId({
  userId,
}: {
  userId: string;
}) {
  return db
    .select()
    .from(platformProject)
    .where(eq(platformProject.userId, userId))
    .orderBy(desc(platformProject.updatedAt));
}

export async function getPlatformProjectById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const [project] = await db
    .select()
    .from(platformProject)
    .where(and(eq(platformProject.id, id), eq(platformProject.userId, userId)));
  return project ?? null;
}

/** MCP API: load project by id only (auth via X-Docs4LLM-Token). */
export async function getPlatformProjectForMcp({ id }: { id: string }) {
  const [project] = await db
    .select()
    .from(platformProject)
    .where(eq(platformProject.id, id));
  return project ?? null;
}

/**
 * MCP API: load project metadata WITHOUT the multi-megabyte `crawlData`
 * JSON. Use for `tools/list` and other endpoints that only need auth +
 * status + artifacts (the MCP token hash, project name, source URL, and
 * `compressedTools` all live in `artifacts`).
 *
 * Cuts the per-request payload from ~4-8 MB to ~10-50 KB for typical
 * projects, and avoids parsing the giant JSON on the Vercel lambda.
 */
export async function getPlatformProjectMetaForMcp({ id }: { id: string }) {
  const [project] = await db
    .select({
      id: platformProject.id,
      userId: platformProject.userId,
      name: platformProject.name,
      sourceUrl: platformProject.sourceUrl,
      sourceType: platformProject.sourceType,
      status: platformProject.status,
      artifacts: platformProject.artifacts,
      ownerType: platformProject.ownerType,
      teamId: platformProject.teamId,
      customDomain: platformProject.customDomain,
      // crawlData intentionally omitted; logs/tokenUsage not needed at runtime
      createdAt: platformProject.createdAt,
      updatedAt: platformProject.updatedAt,
    })
    .from(platformProject)
    .where(eq(platformProject.id, id));
  if (!project) {
    return null;
  }
  // Return a shape compatible with full PlatformProject for downstream code,
  // with crawlData explicitly null so callers don't accidentally use it.
  return {
    ...project,
    crawlData: null,
    logs: null,
    tokenUsage: null,
  };
}

/**
 * MCP API: resolve a project by its (verified) company custom domain.
 * Used to map an incoming Host header like `mcp.acme.com` to the backing
 * project so company MCP traffic is attributed correctly.
 */
export async function getPlatformProjectByCustomDomain(domain: string) {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const [project] = await db
    .select()
    .from(platformProject)
    .where(
      and(
        eq(platformProject.customDomain, normalized),
        eq(platformProject.customDomainVerified, true)
      )
    );
  return project ?? null;
}

export async function adminSetProjectCustomDomain({
  projectId,
  customDomain,
  customDomainVerified,
}: {
  projectId: string;
  customDomain: string | null;
  customDomainVerified: boolean;
}) {
  const normalized = customDomain?.trim().toLowerCase() || null;
  const [updated] = await db
    .update(platformProject)
    .set({
      customDomain: normalized,
      customDomainVerified,
      updatedAt: new Date(),
    })
    .where(eq(platformProject.id, projectId))
    .returning();
  return updated ?? null;
}

/**
 * Mark a project as company-owned (official MCP infrastructure) and attach an
 * optional custom domain. Scoped to the owning user so a developer can only
 * convert their own projects.
 */
export async function setProjectCompanyOwnership({
  id,
  userId,
  ownerType,
  teamId,
  customDomain,
  customDomainVerified,
}: {
  id: string;
  userId: string;
  ownerType: PlatformProject["ownerType"];
  teamId?: string | null;
  customDomain?: string | null;
  customDomainVerified?: boolean;
}) {
  const [updated] = await db
    .update(platformProject)
    .set({
      ownerType,
      teamId: teamId ?? null,
      customDomain: customDomain ? customDomain.trim().toLowerCase() : null,
      customDomainVerified: customDomainVerified ?? false,
      updatedAt: new Date(),
    })
    .where(and(eq(platformProject.id, id), eq(platformProject.userId, userId)))
    .returning();
  return updated ?? null;
}

/**
 * Record one billable MCP hit, attributed to developer vs company traffic.
 * Upserts a per-(project, day) aggregate row so the DB knows which kind of
 * MCP is being hit without a write-amplifying per-request log. Best-effort:
 * callers fire-and-forget so a tracking failure never breaks an MCP response.
 */
export async function recordMcpHit({
  projectId,
  ownerType,
  teamId,
}: {
  projectId: string;
  ownerType: PlatformProject["ownerType"];
  teamId?: string | null;
}) {
  const day = new Date().toISOString().slice(0, 10);
  await db
    .insert(mcpHit)
    .values({
      projectId,
      ownerType,
      teamId: teamId ?? null,
      day,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [mcpHit.projectId, mcpHit.day],
      set: {
        count: sql`${mcpHit.count} + 1`,
        ownerType,
        teamId: teamId ?? null,
        updatedAt: new Date(),
      },
    });
}

/**
 * Aggregate MCP usage for a project, split by owner attribution. Powers the
 * "developer vs company" usage breakdown in dashboards/admin.
 */
export async function getMcpHitStats({ projectId }: { projectId: string }) {
  const rows = await db
    .select({
      ownerType: mcpHit.ownerType,
      total: sql<number>`coalesce(sum(${mcpHit.count}), 0)`,
    })
    .from(mcpHit)
    .where(eq(mcpHit.projectId, projectId))
    .groupBy(mcpHit.ownerType);

  let developer = 0;
  let company = 0;
  for (const row of rows) {
    const total = Number(row.total) || 0;
    if (row.ownerType === "company") {
      company += total;
    } else {
      developer += total;
    }
  }
  return { developer, company, total: developer + company };
}

export async function updatePlatformProject({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    status: PlatformProject["status"];
    artifacts: unknown;
    crawlData: unknown;
    logs: unknown;
    tokenUsage: unknown;
    name: string;
  }>;
}) {
  const [updated] = await db
    .update(platformProject)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(platformProject.id, id), eq(platformProject.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deletePlatformProject({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  await db
    .delete(platformProject)
    .where(and(eq(platformProject.id, id), eq(platformProject.userId, userId)));
}

export async function createMcpServerRecord({
  projectId,
  userId,
  name,
  config,
  tools,
}: {
  projectId: string;
  userId: string;
  name: string;
  config: unknown;
  tools: unknown;
}) {
  const [record] = await db
    .insert(mcpServer)
    .values({ projectId, userId, name, config, tools })
    .returning();
  return record;
}

// biome-ignore lint/suspicious/useAwait: drizzle query returns a thenable promise
export async function getMcpServersByUserId({ userId }: { userId: string }) {
  return db
    .select()
    .from(mcpServer)
    .where(eq(mcpServer.userId, userId))
    .orderBy(desc(mcpServer.createdAt));
}

// biome-ignore lint/suspicious/useAwait: drizzle query returns a thenable promise
export async function getWorkflowsByUserId({ userId }: { userId: string }) {
  return db
    .select()
    .from(aiWorkflow)
    .where(eq(aiWorkflow.userId, userId))
    .orderBy(desc(aiWorkflow.updatedAt));
}

export async function saveWorkflow({
  userId,
  name,
  nodes,
  edges,
  projectId,
}: {
  userId: string;
  name: string;
  nodes: unknown;
  edges: unknown;
  projectId?: string;
}) {
  const [workflow] = await db
    .insert(aiWorkflow)
    .values({ userId, name, nodes, edges, projectId })
    .returning();
  return workflow;
}

// Admin Analytics Queries
export async function getAdminStats() {
  try {
    const rows = (await db.execute(sql`
      SELECT relname, GREATEST(reltuples::bigint, 0)::int AS estimate
      FROM pg_class
      WHERE relkind = 'r'
        AND relname IN ('User', 'PlatformProject', 'McpServer')
    `)) as Array<{ relname: string; estimate: number }>;

    const estimates = new Map(
      rows.map((row) => [row.relname, Number(row.estimate) || 0])
    );

    return {
      totalUsers: estimates.get("User") ?? 0,
      totalProjects: estimates.get("PlatformProject") ?? 0,
      totalMCPs: estimates.get("McpServer") ?? 0,
    };
  } catch (_error) {
    return {
      totalUsers: 0,
      totalProjects: 0,
      totalMCPs: 0,
    };
  }
}

export async function getAllProjects(limit = 50, offset = 0) {
  try {
    return await db
      .select()
      .from(platformProject)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(platformProject.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get all projects"
    );
  }
}

export async function getAllUsers(limit = 50, offset = 0) {
  try {
    return await db
      .select()
      .from(user)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(user.createdAt));
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get all users");
  }
}

export async function getUserProjects(userId: string) {
  try {
    return await db
      .select()
      .from(platformProject)
      .where(eq(platformProject.userId, userId))
      .orderBy(desc(platformProject.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user projects"
    );
  }
}

export async function updateUserName(userId: string, name: string | null) {
  const normalized =
    typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
  const [updated] = await db
    .update(user)
    .set({ name: normalized, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();
  return updated ?? null;
}

export async function countUserConversionsThisMonth(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const result = await db
    .select({ count: count() })
    .from(platformProject)
    .where(
      and(
        eq(platformProject.userId, userId),
        gte(platformProject.createdAt, startOfMonth),
        ne(platformProject.status, "error")
      )
    );

  return result[0]?.count ?? 0;
}

// biome-ignore lint/suspicious/useAwait: drizzle query returns a thenable promise
export async function getAllProjectsWithUser(limit = 100) {
  return db
    .select({
      project: platformProject,
      userEmail: user.email,
    })
    .from(platformProject)
    .innerJoin(user, eq(platformProject.userId, user.id))
    .orderBy(desc(platformProject.createdAt))
    .limit(limit);
}

/**
 * Marketplace: every successfully generated MCP is auto-listed here.
 *
 * Returns only `ready` projects from users who are not disabled, joined
 * with the owner's display name (NOT email — email is PII and never
 * leaves the server for the public marketplace). Token hashes and the
 * heavy `crawlData` blob are intentionally excluded.
 */
export async function getMarketplaceProjects({
  limit = 200,
  offset = 0,
  search,
  sourceType,
}: {
  limit?: number;
  offset?: number;
  search?: string;
  sourceType?: PlatformProject["sourceType"];
} = {}) {
  const filters: SQL[] = [
    eq(platformProject.status, "ready"),
    eq(user.disabled, false),
  ];

  if (sourceType) {
    filters.push(eq(platformProject.sourceType, sourceType));
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    const searchFilter = or(
      ilike(platformProject.name, term),
      ilike(platformProject.sourceUrl, term)
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  return await db
    .select({
      id: platformProject.id,
      name: platformProject.name,
      sourceUrl: platformProject.sourceUrl,
      sourceType: platformProject.sourceType,
      artifacts: platformProject.artifacts,
      createdAt: platformProject.createdAt,
      updatedAt: platformProject.updatedAt,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(platformProject)
    .innerJoin(user, eq(platformProject.userId, user.id))
    .where(and(...filters))
    .orderBy(
      sql`CASE WHEN lower(${user.email}) = 'gautammanak1@gmail.com' THEN 0 ELSE 1 END`,
      desc(platformProject.createdAt)
    )
    .limit(limit)
    .offset(offset);
}

/** Marketplace: single MCP detail (public-safe fields only). */
export async function getMarketplaceProjectById(id: string) {
  const [row] = await db
    .select({
      id: platformProject.id,
      name: platformProject.name,
      sourceUrl: platformProject.sourceUrl,
      sourceType: platformProject.sourceType,
      status: platformProject.status,
      artifacts: platformProject.artifacts,
      createdAt: platformProject.createdAt,
      updatedAt: platformProject.updatedAt,
      ownerName: user.name,
      ownerDisabled: user.disabled,
    })
    .from(platformProject)
    .innerJoin(user, eq(platformProject.userId, user.id))
    .where(eq(platformProject.id, id));

  if (!row) {
    return null;
  }
  if (row.status !== "ready" || row.ownerDisabled) {
    return null;
  }
  return row;
}

export async function getAllUsersWithStats(limit = 100) {
  const users = await db
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);

  const projectCounts = await db
    .select({
      userId: platformProject.userId,
      count: count(),
    })
    .from(platformProject)
    .where(inArray(platformProject.userId, userIds))
    .groupBy(platformProject.userId);

  const projectCountByUser = new Map<string, number>();
  for (const row of projectCounts) {
    projectCountByUser.set(row.userId, Number(row.count) || 0);
  }

  return users.map((u) => ({
    ...u,
    projectCount: projectCountByUser.get(u.id) ?? 0,
    plan: "free" as const,
    subscriptionStatus: null,
    periodEnd: null,
  }));
}

export async function disableUser(userId: string) {
  await db
    .update(user)
    .set({ disabled: true, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

export async function hardDeleteProject(projectId: string) {
  await db.delete(mcpServer).where(eq(mcpServer.projectId, projectId));
  await db.delete(platformProject).where(eq(platformProject.id, projectId));
}

export async function hardDeleteUser(userId: string) {
  const userProjects = await db
    .select({ id: platformProject.id })
    .from(platformProject)
    .where(eq(platformProject.userId, userId));

  for (const p of userProjects) {
    await hardDeleteProject(p.id);
  }

  await db.delete(user).where(eq(user.id, userId));
}

export async function createCliAuthRequest({
  deviceCodeHash,
  userCode,
  expiresAt,
}: {
  deviceCodeHash: string;
  userCode: string;
  expiresAt: Date;
}) {
  const [row] = await db
    .insert(cliAuthRequest)
    .values({
      deviceCodeHash,
      userCode,
      status: "pending",
      expiresAt,
    })
    .returning();
  return row;
}

export async function getCliAuthRequestByDeviceCodeHash({
  deviceCodeHash,
}: {
  deviceCodeHash: string;
}) {
  const [row] = await db
    .select()
    .from(cliAuthRequest)
    .where(eq(cliAuthRequest.deviceCodeHash, deviceCodeHash))
    .limit(1);
  return row ?? null;
}

export async function getCliAuthRequestByUserCode({
  userCode,
}: {
  userCode: string;
}) {
  const [row] = await db
    .select()
    .from(cliAuthRequest)
    .where(eq(cliAuthRequest.userCode, userCode.toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function approveCliAuthRequest({
  id,
  userId,
  cliTokenId,
  issuedTokenPlaintext,
}: {
  id: string;
  userId: string;
  cliTokenId: string;
  issuedTokenPlaintext: string;
}) {
  const [row] = await db
    .update(cliAuthRequest)
    .set({
      status: "approved",
      userId,
      cliTokenId,
      issuedTokenPlaintext,
    })
    .where(eq(cliAuthRequest.id, id))
    .returning();
  return row ?? null;
}

export async function consumeCliAuthIssuedToken({ id }: { id: string }) {
  const [row] = await db
    .update(cliAuthRequest)
    .set({ issuedTokenPlaintext: null })
    .where(eq(cliAuthRequest.id, id))
    .returning();
  return row ?? null;
}

export async function expireStaleCliAuthRequests() {
  await db
    .update(cliAuthRequest)
    .set({ status: "expired" })
    .where(
      and(
        eq(cliAuthRequest.status, "pending"),
        lt(cliAuthRequest.expiresAt, new Date())
      )
    );
}

export async function createCliToken({
  userId,
  tokenHash,
  name = "CLI",
}: {
  userId: string;
  tokenHash: string;
  name?: string;
}) {
  const [row] = await db
    .insert(cliToken)
    .values({
      userId,
      tokenHash,
      name,
    })
    .returning();
  return row;
}

export async function getCliTokenByHash({ tokenHash }: { tokenHash: string }) {
  const [row] = await db
    .select()
    .from(cliToken)
    .where(eq(cliToken.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

export async function touchCliTokenLastUsed({ id }: { id: string }) {
  await db
    .update(cliToken)
    .set({ lastUsedAt: new Date() })
    .where(eq(cliToken.id, id));
}

export async function revokeCliTokensForUser({ userId }: { userId: string }) {
  await db
    .update(cliToken)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(cliToken.userId, userId), sql`${cliToken.revokedAt} IS NULL`)
    );
}

export async function listMcpAccessTokensForUser({
  userId,
}: {
  userId: string;
}) {
  return await db
    .select({
      id: mcpAccessToken.id,
      name: mcpAccessToken.name,
      lastUsedAt: mcpAccessToken.lastUsedAt,
      createdAt: mcpAccessToken.createdAt,
      revokedAt: mcpAccessToken.revokedAt,
    })
    .from(mcpAccessToken)
    .where(eq(mcpAccessToken.userId, userId))
    .orderBy(desc(mcpAccessToken.createdAt));
}

export async function createMcpAccessTokenRow({
  userId,
  tokenHash,
  name = "Marketplace",
}: {
  userId: string;
  tokenHash: string;
  name?: string;
}) {
  const [row] = await db
    .insert(mcpAccessToken)
    .values({ userId, tokenHash, name })
    .returning();
  return row;
}

export async function getMcpAccessTokenByHash({
  tokenHash,
}: {
  tokenHash: string;
}) {
  const [row] = await db
    .select()
    .from(mcpAccessToken)
    .where(eq(mcpAccessToken.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

export async function touchMcpAccessTokenLastUsed({ id }: { id: string }) {
  await db
    .update(mcpAccessToken)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpAccessToken.id, id));
}

export async function revokeMcpAccessToken({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const [row] = await db
    .update(mcpAccessToken)
    .set({ revokedAt: new Date() })
    .where(and(eq(mcpAccessToken.id, id), eq(mcpAccessToken.userId, userId)))
    .returning();
  return row ?? null;
}

export async function getActiveMcpAccessTokenForUser({
  userId,
}: {
  userId: string;
}) {
  const [row] = await db
    .select()
    .from(mcpAccessToken)
    .where(
      and(
        eq(mcpAccessToken.userId, userId),
        sql`${mcpAccessToken.revokedAt} IS NULL`
      )
    )
    .orderBy(desc(mcpAccessToken.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getMcpHitStatsForUserProjects({
  userId,
}: {
  userId: string;
}) {
  const rows = await db
    .select({
      projectId: mcpHit.projectId,
      projectName: platformProject.name,
      sourceUrl: platformProject.sourceUrl,
      day: mcpHit.day,
      count: mcpHit.count,
      ownerType: mcpHit.ownerType,
    })
    .from(mcpHit)
    .innerJoin(platformProject, eq(mcpHit.projectId, platformProject.id))
    .where(eq(platformProject.userId, userId))
    .orderBy(desc(mcpHit.day));

  return rows;
}

export async function getAdminMcpHitSummary(limit = 50) {
  const rows = await db
    .select({
      projectId: mcpHit.projectId,
      projectName: platformProject.name,
      sourceUrl: platformProject.sourceUrl,
      userId: platformProject.userId,
      total: sql<number>`coalesce(sum(${mcpHit.count}), 0)`,
    })
    .from(mcpHit)
    .innerJoin(platformProject, eq(mcpHit.projectId, platformProject.id))
    .groupBy(
      mcpHit.projectId,
      platformProject.name,
      platformProject.sourceUrl,
      platformProject.userId
    )
    .orderBy(desc(sql`coalesce(sum(${mcpHit.count}), 0)`))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    total: Number(r.total) || 0,
  }));
}

function slugifyTeamName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "workspace"
  );
}

export async function getOrCreateOwnedTeam({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const [existing] = await db
    .select()
    .from(team)
    .where(eq(team.ownerId, userId))
    .limit(1);
  if (existing) {
    return existing;
  }

  const baseName = email?.split("@")[0] || "My workspace";
  const name = `${baseName}'s workspace`;
  let slug = slugifyTeamName(baseName);
  const [collision] = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.slug, slug))
    .limit(1);
  if (collision) {
    slug = `${slug}-${generateUUID().slice(0, 6)}`;
  }

  const [created] = await db
    .insert(team)
    .values({
      name,
      slug,
      ownerId: userId,
      plan: "team",
    })
    .returning();

  if (created) {
    await db.insert(teamMember).values({
      teamId: created.id,
      userId,
      role: "owner",
    });
  }

  return created;
}

/** Returns the team only when `userId` is the owner. */
export async function getOwnedTeamById({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const [owned] = await db
    .select()
    .from(team)
    .where(and(eq(team.id, teamId), eq(team.ownerId, userId)))
    .limit(1);
  return owned ?? null;
}

export async function listTeamInvitesForOwner({ userId }: { userId: string }) {
  const owned = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.ownerId, userId));
  if (owned.length === 0) {
    return [];
  }
  const teamIds = owned.map((t) => t.id);
  return db
    .select()
    .from(teamInvite)
    .where(inArray(teamInvite.teamId, teamIds))
    .orderBy(desc(teamInvite.createdAt));
}

export async function createTeamInvite({
  teamId,
  email,
  invitedBy,
  role = "member",
}: {
  teamId: string;
  email: string;
  invitedBy: string;
  role?: "admin" | "member";
}) {
  const owned = await getOwnedTeamById({ teamId, userId: invitedBy });
  if (!owned) {
    throw new Error("forbidden: only the team owner can create invites");
  }

  const [existingPending] = await db
    .select({ id: teamInvite.id })
    .from(teamInvite)
    .where(
      and(
        eq(teamInvite.teamId, owned.id),
        eq(teamInvite.email, email.trim().toLowerCase()),
        eq(teamInvite.status, "pending")
      )
    )
    .limit(1);
  if (existingPending) {
    throw new Error("conflict: pending invite already exists for this email");
  }

  const rawToken = generateUUID();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite] = await db
    .insert(teamInvite)
    .values({
      teamId: owned.id,
      email: email.trim().toLowerCase(),
      role,
      invitedBy,
      tokenHash,
      status: "pending",
      expiresAt,
    })
    .returning();

  return { invite, rawToken };
}
