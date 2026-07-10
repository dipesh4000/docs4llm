/**
 * OpenTelemetry tracing helpers.
 *
 * Wraps every async operation in a span. Records exceptions, sets status,
 * and attaches semantic attributes (service.*, doc2mcp.*).
 *
 * Used everywhere we want a measurable unit of work: pipeline phases,
 * AI calls, fetches, DB queries with hot paths, etc.
 */

import { type Attributes, SpanStatusCode, trace } from "@opentelemetry/api";

const TRACER_NAME = "doc2mcp";

export function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

export type SpanOptions = {
  attributes?: Attributes;
};

/**
 * Wrap an async function in a span. Records errors and re-throws them.
 *
 * Example:
 *   await withSpan("pipeline.crawl", { attributes: { projectId } }, async () => {
 *     return await crawlDocsSource(url, type);
 *   });
 */
export async function withSpan<T>(
  name: string,
  options: SpanOptions,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return await tracer.startActiveSpan(name, async (span) => {
    if (options.attributes) {
      span.setAttributes(options.attributes);
    }
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      span.setAttribute("duration_ms", durationMs);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      span.setAttribute("duration_ms", durationMs);
      const message = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : "Error";
      span.recordException(err as Error);
      span.setAttribute("error.name", name);
      span.setAttribute("error.message", message);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Synchronous variant for short operations.
 */
export function withSpanSync<T>(
  name: string,
  options: SpanOptions,
  fn: () => T
): T {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, (span) => {
    if (options.attributes) {
      span.setAttributes(options.attributes);
    }
    try {
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Add attributes to the currently active span without creating a new one.
 * Useful for enriching a parent span with details discovered mid-flight
 * (e.g. number of pages crawled, model used, token usage).
 */
export function addSpanAttributes(attrs: Attributes) {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  span.setAttributes(attrs);
}

/**
 * Record a discrete event on the current span (e.g. "cache.hit").
 */
export function addSpanEvent(name: string, attrs?: Attributes) {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  span.addEvent(name, attrs);
}

/**
 * Return current trace id (hex) if a span is active. Useful for surfacing
 * a "correlation id" in API error responses so logs and traces can be joined.
 */
export function currentTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  const id = span.spanContext()?.traceId;
  return id && id !== "00000000000000000000000000000000" ? id : undefined;
}
