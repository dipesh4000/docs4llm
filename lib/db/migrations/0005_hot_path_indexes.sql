-- 0005_hot_path_indexes.sql
-- Adds covering indexes for all foreign-keyed hot paths surfaced by
-- Supabase performance advisor + audit (Phase 1 of perf migration).
-- Applied to remote 2026-05-31 via supabase MCP apply_migration.

-- Hot user-keyed reads
CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_idx"
  ON "Chat" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Message_v2_chatId_createdAt_idx"
  ON "Message_v2" ("chatId", "createdAt" ASC);

-- Rate-limit query: WHERE chat.userId AND message.role='user' AND message.createdAt >= ?
CREATE INDEX IF NOT EXISTS "Message_v2_role_createdAt_idx"
  ON "Message_v2" ("role", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Stream_chatId_createdAt_idx"
  ON "Stream" ("chatId", "createdAt" ASC);

-- Platform project list + count queries
CREATE INDEX IF NOT EXISTS "PlatformProject_userId_updatedAt_idx"
  ON "PlatformProject" ("userId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "PlatformProject_userId_createdAt_idx"
  ON "PlatformProject" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "PlatformProject_status_idx"
  ON "PlatformProject" ("status");

-- MCP server lookup by user / project
CREATE INDEX IF NOT EXISTS "McpServer_userId_idx" ON "McpServer" ("userId");
CREATE INDEX IF NOT EXISTS "McpServer_projectId_idx" ON "McpServer" ("projectId");

-- AI workflow lookup
CREATE INDEX IF NOT EXISTS "AiWorkflow_userId_idx" ON "AiWorkflow" ("userId");
CREATE INDEX IF NOT EXISTS "AiWorkflow_projectId_idx" ON "AiWorkflow" ("projectId");

-- Active subscription lookup
CREATE INDEX IF NOT EXISTS "Subscription_userId_status_idx"
  ON "Subscription" ("userId", "status");

-- Document FKs
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document" ("userId");
CREATE INDEX IF NOT EXISTS "Suggestion_documentId_documentCreatedAt_idx"
  ON "Suggestion" ("documentId", "documentCreatedAt");
CREATE INDEX IF NOT EXISTS "Suggestion_userId_idx" ON "Suggestion" ("userId");

-- JobMetric FKs
CREATE INDEX IF NOT EXISTS "JobMetric_userId_idx" ON "JobMetric" ("userId");

-- Vote_v2 right-side FK (PK is left-leaning on chatId)
CREATE INDEX IF NOT EXISTS "Vote_v2_messageId_idx" ON "Vote_v2" ("messageId");
