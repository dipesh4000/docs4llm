import { connection } from "next/server";
import { Suspense } from "react";
import { SkeletonTable } from "@/components/ui/page-skeleton";
import { getAdminMcpHitSummary } from "@/lib/db/queries";

export default function AdminMcpUsagePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl">MCP usage</h2>
        <p className="text-muted-foreground text-sm">
          Aggregate tool-call hits across all hosted MCP projects
        </p>
      </div>
      <Suspense fallback={<SkeletonTable columns={4} rows={8} />}>
        <McpUsageRows />
      </Suspense>
    </div>
  );
}

async function McpUsageRows() {
  await connection();
  const rows = await getAdminMcpHitSummary(100);
  const max = Math.max(1, ...rows.map((r) => r.total));

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No MCP hit data yet.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50">
      <table className="w-full text-left text-sm">
        <thead className="border-border/40 border-b bg-muted/30 text-muted-foreground text-xs">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Hits</th>
            <th className="hidden px-4 py-3 md:table-cell">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => (
            <tr key={row.projectId}>
              <td className="px-4 py-3">
                <p className="font-medium">{row.projectName ?? "Untitled"}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {row.sourceUrl}
                </p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {row.userId.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 font-display font-semibold">
                {row.total}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.max(4, Math.round((row.total / max) * 100))}%`,
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
