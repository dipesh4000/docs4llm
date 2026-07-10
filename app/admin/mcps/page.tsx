import { connection } from "next/server";
import { Suspense } from "react";
import { McpsTable } from "@/components/admin/mcps-table";
import { SkeletonTable } from "@/components/ui/page-skeleton";
import { getAllProjectsWithUser } from "@/lib/db/queries";

export default function AdminMcpsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl">MCP projects</h2>
        <p className="text-muted-foreground text-sm">
          All conversions · hard delete removes project and MCP servers
        </p>
      </div>
      <Suspense fallback={<SkeletonTable columns={6} rows={10} />}>
        <McpsRows />
      </Suspense>
    </div>
  );
}

async function McpsRows() {
  await connection();
  const rows = await getAllProjectsWithUser(200);

  return (
    <McpsTable
      rows={rows.map((r) => ({
        id: r.project.id,
        name: r.project.name,
        status: r.project.status,
        sourceUrl: r.project.sourceUrl,
        sourceType: r.project.sourceType,
        userEmail: r.userEmail,
        createdAt: r.project.createdAt.toISOString(),
      }))}
    />
  );
}
