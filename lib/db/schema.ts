import { type InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: text("name"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const platformProject = pgTable("PlatformProject", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  sourceUrl: text("sourceUrl"),
  sourceType: varchar("sourceType", {
    enum: [
      "url",
      "github",
      "markdown",
      "openapi",
      "postman",
      "html",
      "gitbook",
    ],
  }).notNull(),
  status: varchar("status", {
    enum: ["pending", "crawling", "analyzing", "generating", "ready", "error"],
  })
    .notNull()
    .default("pending"),
  artifacts: json("artifacts"),
  crawlData: json("crawlData"),
  logs: json("logs"),
  tokenUsage: json("tokenUsage"),
  source: varchar("source", { enum: ["web", "cli"] })
    .notNull()
    .default("web"),
  /**
   * Who owns this MCP. `developer` = a self-serve individual; `company` =
   * official MCP infrastructure backing a paid team. Drives per-hit
   * attribution so we know whether a company's customers/agents are hitting
   * the endpoint vs an individual developer.
   */
  ownerType: varchar("ownerType", { enum: ["developer", "company"] })
    .notNull()
    .default("developer"),
  /** Set when the project belongs to a company/team workspace. */
  teamId: uuid("teamId"),
  /** Company custom domain serving this MCP endpoint, e.g. mcp.acme.com. */
  customDomain: text("customDomain"),
  customDomainVerified: boolean("customDomainVerified")
    .notNull()
    .default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type PlatformProject = InferSelectModel<typeof platformProject>;

/** Page — crawled documentation page content for a platform project. */
export const page = pgTable("Page", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => platformProject.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  contentType: varchar("contentType").notNull().default("page"),
  content: text("content").notNull(),
  contentHash: varchar("contentHash"),
  bytes: integer("bytes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Page = InferSelectModel<typeof page>;

export const mcpServer = pgTable("McpServer", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => platformProject.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  config: json("config").notNull(),
  tools: json("tools").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type McpServer = InferSelectModel<typeof mcpServer>;

/** McpServerRelease — public/generated release metadata for marketplace use. */
export const mcpServerRelease = pgTable("McpServerRelease", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => platformProject.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  slug: varchar("slug").notNull(),
  version: varchar("version").notNull().default("1.0.0"),
  title: text("title").notNull(),
  description: text("description"),
  serverJson: jsonb("serverJson").notNull(),
  isPublic: boolean("isPublic").notNull().default(false),
  githubRepoUrl: text("githubRepoUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type McpServerRelease = InferSelectModel<typeof mcpServerRelease>;

export const aiWorkflow = pgTable("AiWorkflow", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId").references(() => platformProject.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  nodes: json("nodes").notNull(),
  edges: json("edges").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AiWorkflow = InferSelectModel<typeof aiWorkflow>;

/** PipelineJob — background processing state for a project conversion. */
export const pipelineJob = pgTable("PipelineJob", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => platformProject.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  status: varchar("status", {
    enum: ["queued", "running", "success", "failed", "cancelled"],
  })
    .notNull()
    .default("queued"),
  phase: varchar("phase").notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  attempt: integer("attempt").notNull().default(1),
  errorClass: varchar("errorClass"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  finishedAt: timestamp("finishedAt"),
});

export type PipelineJob = InferSelectModel<typeof pipelineJob>;

/** ProjectEvent — ordered event log emitted while a project is processed. */
export const projectEvent = pgTable("ProjectEvent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => platformProject.id),
  seq: integer("seq")
    .notNull()
    .default(sql`nextval('"ProjectEvent_seq_seq"'::regclass)`),
  type: varchar("type").notNull(),
  level: varchar("level", { enum: ["info", "warn", "error"] })
    .notNull()
    .default("info"),
  phase: varchar("phase"),
  message: text("message"),
  data: jsonb("data"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ProjectEvent = InferSelectModel<typeof projectEvent>;

/**
 * JobMetric — observability table for pipeline runs.
 *
 * One row per pipeline execution (per project, per retry). Used by the
 * observability dashboard to compute success rates, latency percentiles,
 * error-class distribution, and recent failures.
 */
export const jobMetric = pgTable("JobMetric", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  jobType: varchar("jobType", {
    enum: ["pipeline", "crawl", "extract", "validate"],
  }).notNull(),
  projectId: uuid("projectId").references(() => platformProject.id, {
    onDelete: "set null",
  }),
  userId: uuid("userId").references(() => user.id, { onDelete: "set null" }),
  status: varchar("status", {
    enum: ["queued", "running", "success", "failed", "cancelled"],
  }).notNull(),
  attempt: varchar("attempt", { length: 4 }).notNull().default("1"),
  durationMs: varchar("durationMs", { length: 20 }),
  errorClass: varchar("errorClass", { length: 64 }),
  errorMessage: text("errorMessage"),
  traceId: varchar("traceId", { length: 64 }),
  metadata: json("metadata"),
  startedAt: timestamp("startedAt").notNull().defaultNow(),
  finishedAt: timestamp("finishedAt"),
});

export type JobMetric = InferSelectModel<typeof jobMetric>;

export const contactMessage = pgTable("ContactMessage", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 120 }),
  orderId: varchar("orderId", { length: 120 }),
  message: text("message").notNull(),
  ip: varchar("ip", { length: 64 }).notNull().default("unknown"),
  userAgent: text("userAgent"),
  deliveryStatus: varchar("deliveryStatus", {
    enum: ["pending", "sent", "failed", "not_configured"],
  })
    .notNull()
    .default("pending"),
  deliveryReason: text("deliveryReason"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ContactMessage = InferSelectModel<typeof contactMessage>;

/** IpRateLimit — per-IP counters for unauthenticated throttling. */
export const ipRateLimit = pgTable("IpRateLimit", {
  ip: varchar("ip").primaryKey().notNull(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("resetAt").notNull(),
});

export type IpRateLimit = InferSelectModel<typeof ipRateLimit>;

/**
 * Team — a workspace that groups users under a shared plan and credit pool.
 * Mirrors the existing `Team` table already provisioned in the database.
 */
export const team = pgTable("Team", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  ownerId: uuid("ownerId")
    .notNull()
    .references(() => user.id),
  plan: varchar("plan", { enum: ["team", "enterprise"] })
    .notNull()
    .default("team"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Team = InferSelectModel<typeof team>;

/** TeamMember — a user's membership (and role) within a team. */
export const teamMember = pgTable("TeamMember", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  teamId: uuid("teamId")
    .notNull()
    .references(() => team.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  role: varchar("role", { enum: ["owner", "admin", "member"] })
    .notNull()
    .default("member"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type TeamMember = InferSelectModel<typeof teamMember>;

/** TeamInvite — a pending email invitation to join a team. */
export const teamInvite = pgTable("TeamInvite", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  teamId: uuid("teamId")
    .notNull()
    .references(() => team.id),
  email: varchar("email").notNull(),
  role: varchar("role", { enum: ["admin", "member"] })
    .notNull()
    .default("member"),
  invitedBy: uuid("invitedBy")
    .notNull()
    .references(() => user.id),
  tokenHash: varchar("tokenHash").notNull(),
  status: varchar("status", {
    enum: ["pending", "accepted", "revoked", "expired"],
  })
    .notNull()
    .default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type TeamInvite = InferSelectModel<typeof teamInvite>;

/** CliAuthRequest — device authorization flow for the doc2mcp CLI. */
export const cliAuthRequest = pgTable("CliAuthRequest", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  deviceCodeHash: varchar("deviceCodeHash", { length: 128 }).notNull().unique(),
  userCode: varchar("userCode", { length: 16 }).notNull().unique(),
  status: varchar("status", {
    enum: ["pending", "approved", "denied", "expired"],
  })
    .notNull()
    .default("pending"),
  userId: uuid("userId").references(() => user.id),
  cliTokenId: uuid("cliTokenId"),
  /** Cleared after the CLI polls and receives the PAT once. */
  issuedTokenPlaintext: text("issuedTokenPlaintext"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type CliAuthRequest = InferSelectModel<typeof cliAuthRequest>;

/** CliToken — personal access token for doc2mcp CLI (PAT). */
export const cliToken = pgTable("CliToken", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull().default("CLI"),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  revokedAt: timestamp("revokedAt"),
});

export type CliToken = InferSelectModel<typeof cliToken>;

/** McpAccessToken — per-user token for accessing marketplace MCP servers. */
export const mcpAccessToken = pgTable("McpAccessToken", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull().default("Marketplace"),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  revokedAt: timestamp("revokedAt"),
});

export type McpAccessToken = InferSelectModel<typeof mcpAccessToken>;

/**
 * McpHit — daily aggregate of MCP endpoint usage per project, tagged with
 * owner attribution so analytics can separate developer traffic from company
 * (official-infrastructure) traffic without a per-request row write.
 *
 * One row per (projectId, day); the `count` column is incremented on each
 * billable hit via an upsert.
 */
export const mcpHit = pgTable(
  "McpHit",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("projectId")
      .notNull()
      .references(() => platformProject.id, { onDelete: "cascade" }),
    ownerType: varchar("ownerType", { enum: ["developer", "company"] })
      .notNull()
      .default("developer"),
    teamId: uuid("teamId"),
    day: varchar("day", { length: 10 }).notNull(),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("McpHit_project_day_unique").on(table.projectId, table.day),
  ]
);

export type McpHit = InferSelectModel<typeof mcpHit>;
