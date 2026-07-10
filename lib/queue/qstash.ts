/**
 * QStash background job helpers for the conversion pipeline.
 *
 * Why this exists
 * ---------------
 * On Vercel's Hobby plan every lambda invocation is capped at 60s,
 * INCLUDING work scheduled via `next/server` `after()`. Our pipeline
 * (crawl → Gemini analysis → tool compression → DB writes) routinely
 * takes 40-90s, so the user-facing `POST /api/convert` would time out
 * and leave projects stuck in `crawling` forever.
 *
 * The fix is to move the pipeline into a separate lambda invocation
 * scheduled by Upstash QStash:
 *
 *   1. `/api/convert` creates the project row and calls
 *      `enqueuePipelineJob()`. The user gets a project id immediately.
 *   2. QStash POSTs the payload to `/api/internal/pipeline-worker`,
 *      signed with `QSTASH_CURRENT_SIGNING_KEY`. That route runs the
 *      pipeline with its own fresh 60s budget.
 *
 * Env vars (all from the Upstash QStash dashboard):
 *
 *   - QSTASH_URL                        default = https://qstash.upstash.io
 *   - QSTASH_TOKEN                      required to publish messages
 *   - QSTASH_CURRENT_SIGNING_KEY        required on the worker route
 *   - QSTASH_NEXT_SIGNING_KEY           required on the worker route (rotate)
 *
 * If none of these are set we transparently fall back to the legacy
 * `after()` path — local dev and unit tests keep working without QStash.
 */

import { Client, Receiver } from "@upstash/qstash";
import { getDoc2McpBaseUrl } from "@/lib/doc2mcp/app-url";
import type { SourceType } from "@/types/platform";

export const PIPELINE_WORKER_PATH = "/api/internal/pipeline-worker";

export type PipelineJobPayload = {
  projectId: string;
  userId: string;
  sourceUrl: string;
  sourceType: SourceType;
  projectName: string;
  /** When set, the worker skips crawl/analyze and runs MCP generation only. */
  phase?: "generate";
};

let _client: Client | null = null;
let _receiver: Receiver | null = null;

function resolveQstashEnv() {
  return {
    token: process.env.QSTASH_TOKEN,
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    baseUrl: process.env.QSTASH_URL,
  };
}

export function isQstashConfigured(): boolean {
  const env = resolveQstashEnv();
  return Boolean(env.token);
}

function getClient(): Client | null {
  if (_client) {
    return _client;
  }
  const env = resolveQstashEnv();
  if (!env.token) {
    return null;
  }
  _client = new Client({
    token: env.token,
    baseUrl: env.baseUrl,
  });
  return _client;
}

function getReceiver(): Receiver | null {
  if (_receiver) {
    return _receiver;
  }
  const env = resolveQstashEnv();
  if (!(env.currentSigningKey && env.nextSigningKey)) {
    return null;
  }
  _receiver = new Receiver({
    currentSigningKey: env.currentSigningKey,
    nextSigningKey: env.nextSigningKey,
  });
  return _receiver;
}

/**
 * Publish a pipeline job to QStash. Returns the QStash message id on
 * success, or `null` if QStash isn't configured (caller should fall
 * back to the `after()` path in that case).
 */
export async function enqueuePipelineJob(
  payload: PipelineJobPayload
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  const baseUrl = getDoc2McpBaseUrl();
  const workerUrl = `${baseUrl}${PIPELINE_WORKER_PATH}`;

  const result = await client.publishJSON({
    url: workerUrl,
    body: payload,
    // Retries are cheap; this matters when the worker has a transient
    // Gemini / Supabase blip. QStash applies exponential backoff between
    // attempts automatically.
    retries: 2,
  });

  return result.messageId ?? null;
}

/**
 * Verify the inbound webhook signature on the worker route. Returns
 * `true` for a valid request, `false` for forgery / replay attempts,
 * and `null` when QStash signing keys aren't configured (caller must
 * decide whether to allow the request — only safe in local dev).
 */
export async function verifyPipelineJobRequest(
  rawBody: string,
  signature: string | null
): Promise<boolean | null> {
  const receiver = getReceiver();
  if (!receiver) {
    return null;
  }
  if (!signature) {
    return false;
  }
  try {
    await receiver.verify({ body: rawBody, signature });
    return true;
  } catch {
    return false;
  }
}
