import { requireAdmin } from "@/lib/admin/require-admin";
import { getCacheMetrics } from "@/lib/observability/cache";
import { getCircuitMetrics } from "@/lib/observability/circuit-breaker";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memoryUsage = process.memoryUsage();
  return Response.json({
    caches: getCacheMetrics(),
    circuits: getCircuitMetrics().slice(0, 20),
    process: {
      nodeVersion: process.version,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      region: process.env.VERCEL_REGION ?? null,
    },
  });
}
