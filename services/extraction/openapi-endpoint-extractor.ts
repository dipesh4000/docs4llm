/**
 * Deterministic OpenAPI/Swagger → ApiEndpoint extraction.
 *
 * When the source is a verified machine-readable spec, AI is the wrong layer
 * to extract endpoints. We extract structurally — preserving methods, paths,
 * parameter schemas, auth scopes, request/response examples — and only use
 * the AI later for semantic naming, descriptions, and grouped tools.
 */

import type { ApiEndpoint, AuthType, CrawlResult } from "@/types/platform";

type RawOp = {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Array<{
    name?: string;
    in?: string;
    required?: boolean;
    description?: string;
    schema?: { type?: string };
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: unknown; example?: unknown }>;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: unknown; example?: unknown }>;
    }
  >;
  security?: unknown[];
};

type RawSpec = {
  openapi?: string;
  swagger?: string;
  info?: { title?: string };
  servers?: Array<{ url: string }>;
  paths?: Record<string, Record<string, RawOp>>;
  components?: {
    securitySchemes?: Record<string, { type?: string; scheme?: string }>;
  };
  security?: unknown[];
};

const METHODS = ["get", "post", "put", "patch", "delete", "head"] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function inferAuthFromSpec(
  spec: RawSpec,
  op: RawOp
): { auth: AuthType; scopes?: string[] } {
  const security = op.security ?? spec.security ?? [];
  if (security.length === 0) {
    return { auth: "none" };
  }
  const schemes = spec.components?.securitySchemes ?? {};
  for (const entry of security) {
    if (!isPlainRecord(entry)) {
      continue;
    }
    for (const [schemeName, scopes] of Object.entries(entry)) {
      const scheme = schemes[schemeName];
      const scopeList = Array.isArray(scopes)
        ? scopes.filter((s): s is string => typeof s === "string")
        : undefined;
      if (!scheme?.type) {
        continue;
      }
      const t = scheme.type.toLowerCase();
      if (t === "http" && scheme.scheme?.toLowerCase() === "bearer") {
        return { auth: "bearer", scopes: scopeList };
      }
      if (t === "oauth2") {
        return { auth: "oauth", scopes: scopeList };
      }
      if (t === "apikey") {
        return { auth: "api_key", scopes: scopeList };
      }
    }
  }
  return { auth: "bearer" };
}

export type ExtractedEndpoint = ApiEndpoint & {
  parameters: Array<{
    name: string;
    in: string;
    required: boolean;
    type: string;
    description?: string;
  }>;
  requestExample?: unknown;
  responseExample?: unknown;
  scopes?: string[];
  operationId?: string;
};

/**
 * Parse an OpenAPI spec out of a CrawlResult set produced by
 * `expandOpenApiSpec` (overview is index 0, endpoints follow). Falls back to
 * extracting from `content` fields when raw spec is not in scope.
 */
export function extractEndpointsFromOpenApi(
  spec: RawSpec
): ExtractedEndpoint[] {
  const out: ExtractedEndpoint[] = [];
  let index = 0;

  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const op = methods[method];
      if (!op) {
        continue;
      }
      const { auth, scopes } = inferAuthFromSpec(spec, op);
      const params = (op.parameters ?? [])
        .filter((p) => typeof p.name === "string")
        .map((p) => ({
          name: p.name as string,
          in: p.in ?? "query",
          required: Boolean(p.required),
          type: p.schema?.type ?? "string",
          description: p.description,
        }));
      const reqMedia = Object.values(op.requestBody?.content ?? {})[0];
      const okStatus = Object.entries(op.responses ?? {}).find(([s]) =>
        /^2\d\d$/.test(s)
      );
      const resMedia = Object.values(okStatus?.[1]?.content ?? {})[0];

      out.push({
        id: `endpoint-${index++}`,
        method: method.toUpperCase(),
        path,
        summary: op.summary,
        description: op.description,
        auth,
        tags: op.tags,
        parameters: params,
        requestExample: reqMedia?.example ?? reqMedia?.schema,
        responseExample: resMedia?.example,
        scopes,
        operationId: op.operationId,
      });
    }
  }

  return out;
}

/**
 * Detect that a CrawlResult set was produced by `expandOpenApiSpec`.
 * Signal: first result has type "api" and ends with " — Overview" in title.
 */
export function isOpenApiCrawl(crawl: CrawlResult[]): boolean {
  if (crawl.length < 2) {
    return false;
  }
  const first = crawl[0];
  return Boolean(
    first?.type === "api" && / — Overview$/.test(first.title ?? "")
  );
}
