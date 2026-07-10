/**
 * Structured leveled logger with automatic OTel trace correlation.
 *
 * - Output is single-line JSON when running in production (Vercel parses it).
 * - In dev, output is human-friendly colored text.
 * - Every log line is enriched with the current OTel span's trace_id / span_id
 *   when one is active. This is the bridge between traces and logs.
 * - Sensitive keys are redacted automatically.
 *
 * Usage:
 *   const log = createLogger("pipeline");
 *   log.info("crawl.start", { projectId, sourceUrl });
 *   log.error("crawl.failed", err, { projectId });
 */

import { trace } from "@opentelemetry/api";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACT_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "stripeSecretKey",
  "stripe_secret_key",
  "anonKey",
  "service_role_key",
]);

const ENV_LEVEL = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) ?? "info";
const MIN_LEVEL = LEVEL_ORDER[ENV_LEVEL] ?? LEVEL_ORDER.info;
const IS_DEV = process.env.NODE_ENV !== "production";

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (depth > 4) {
    return "[truncated]";
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (REDACT_KEYS.has(k) || REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 4000) {
    return `${value.slice(0, 4000)}…[+${value.length - 4000} chars]`;
  }
  return value;
}

function currentTraceContext(): {
  trace_id?: string;
  span_id?: string;
} {
  const span = trace.getActiveSpan();
  if (!span) {
    return {};
  }
  const ctx = span.spanContext();
  if (!ctx?.traceId) {
    return {};
  }
  return { trace_id: ctx.traceId, span_id: ctx.spanId };
}

function format(entry: Record<string, unknown>): string {
  if (IS_DEV) {
    const { level, scope, event, msg, error, ...rest } = entry;
    const levelTag =
      level === "error"
        ? "\x1b[31mERR\x1b[0m"
        : level === "warn"
          ? "\x1b[33mWARN\x1b[0m"
          : level === "debug"
            ? "\x1b[90mDEBG\x1b[0m"
            : "\x1b[36mINFO\x1b[0m";
    const tail = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
    const errSuffix = error ? `\n  ${String(error)}` : "";
    return `[${levelTag}] [${scope}] ${event ?? msg ?? ""}${tail}${errSuffix}`;
  }
  return JSON.stringify(entry);
}

function emit(
  level: LogLevel,
  scope: string,
  event: string,
  meta?: Record<string, unknown>,
  err?: unknown
) {
  if (LEVEL_ORDER[level] < MIN_LEVEL) {
    return;
  }
  const ts = new Date().toISOString();
  const traceCtx = currentTraceContext();
  const payload: Record<string, unknown> = {
    ts,
    level,
    scope,
    event,
    ...traceCtx,
    ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
  };
  if (err) {
    const e = err as Error;
    payload.error = {
      message: e?.message ?? String(err),
      name: e?.name,
      stack: IS_DEV ? e?.stack : undefined,
    };
  }
  const line = format(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export type Logger = {
  debug(event: string, meta?: Record<string, unknown>): void;
  info(event: string, meta?: Record<string, unknown>): void;
  warn(event: string, meta?: Record<string, unknown>): void;
  error(event: string, err?: unknown, meta?: Record<string, unknown>): void;
  child(extraScope: string): Logger;
};

export function createLogger(scope: string): Logger {
  return {
    debug(event, meta) {
      emit("debug", scope, event, meta);
    },
    info(event, meta) {
      emit("info", scope, event, meta);
    },
    warn(event, meta) {
      emit("warn", scope, event, meta);
    },
    error(event, err, meta) {
      emit("error", scope, event, meta, err);
    },
    child(extra) {
      return createLogger(`${scope}.${extra}`);
    },
  };
}

export const logger = createLogger("app");
