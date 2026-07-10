import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "doc2mcp",
    attributes: {
      "deployment.environment":
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      "service.version":
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    },
  });
}
