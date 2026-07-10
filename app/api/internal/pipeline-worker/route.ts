/**
 * Internal pipeline worker.
 *
 * Receives a signed POST from QStash carrying a `PipelineJobPayload`,
 * verifies the signature, and runs `processProjectPipeline` with its
 * own fresh 60-second lambda budget. This is what unblocks the Hobby
 * plan deployment: the user-facing `/api/convert` is no longer the
 * lambda that has to fit the entire pipeline.
 *
 * Security:
 *   - Every request is authenticated by QStash's `upstash-signature`
 *     header. Without a valid signature we return 401. If signing
 *     keys aren't configured (local dev), we accept requests only when
 *     `ALLOW_UNSIGNED_PIPELINE_WORKER=1` — never set that in prod.
 */

import {
  type PipelineJobPayload,
  verifyPipelineJobRequest,
} from "@/lib/queue/qstash";
import { processProjectPipeline } from "@/services/pipeline/process-project";

const ALLOW_UNSIGNED = process.env.ALLOW_UNSIGNED_PIPELINE_WORKER === "1";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("upstash-signature");

  const verdict = await verifyPipelineJobRequest(rawBody, signature);

  if (verdict === false) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }
  if (verdict === null && !ALLOW_UNSIGNED) {
    return Response.json({ error: "worker_not_configured" }, { status: 503 });
  }

  let payload: PipelineJobPayload;
  try {
    payload = JSON.parse(rawBody) as PipelineJobPayload;
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (
    !(
      payload.projectId &&
      payload.userId &&
      payload.sourceUrl &&
      payload.sourceType &&
      payload.projectName
    )
  ) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    await processProjectPipeline({
      ...payload,
      phase: payload.phase,
    });
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "pipeline_failed";
    // We DON'T re-throw a 5xx: the pipeline already wrote its own
    // `status: "error"` row to the DB inside `processProjectPipeline`,
    // and we don't want QStash to keep retrying a deterministic failure.
    // For transient errors QStash's own retries already covered us
    // before we got this far.
    return Response.json({ ok: false, error: message });
  }
}
