import { connection } from "next/server";
import { Suspense } from "react";
import { AdminDomainsTable } from "@/components/admin/admin-domains-table";
import { SkeletonTable } from "@/components/ui/page-skeleton";
import { getAllProjectsWithUser } from "@/lib/db/queries";

export default function AdminDomainsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl">Custom domains</h2>
        <p className="text-muted-foreground text-sm">
          Attach a hostname to any MCP project. Mark verified after DNS + TLS
          are live on Vercel.
        </p>
      </div>
      <Suspense fallback={<SkeletonTable columns={6} rows={8} />}>
        <DomainRows />
      </Suspense>
    </div>
  );
}

async function DomainRows() {
  await connection();
  const rows = await getAllProjectsWithUser(300);

  return (
    <AdminDomainsTable
      rows={rows.map((r) => ({
        id: r.project.id,
        name: r.project.name,
        status: r.project.status,
        userEmail: r.userEmail,
        customDomain: r.project.customDomain,
        customDomainVerified: r.project.customDomainVerified,
      }))}
    />
  );
}
