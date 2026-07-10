/** Public base URL for MCP server callbacks (no trailing slash). */
export function getDoc2McpBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  // Ignore a localhost value when running on Vercel so generated MCP configs
  // never ship a localhost endpoint to production users.
  if (configured && !(process.env.VERCEL && configured.includes("localhost"))) {
    return configured.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
