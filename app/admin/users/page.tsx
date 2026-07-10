import { connection } from "next/server";
import { Suspense } from "react";
import { UsersTable } from "@/components/admin/users-table";
import { SkeletonTable } from "@/components/ui/page-skeleton";
import { getAllUsersWithStats } from "@/lib/db/queries";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl">Users</h2>
        <p className="text-muted-foreground text-sm">
          Disable bans Supabase login and revokes the user's access.
        </p>
      </div>
      <Suspense fallback={<SkeletonTable columns={6} rows={10} />}>
        <UsersRows />
      </Suspense>
    </div>
  );
}

async function UsersRows() {
  await connection();
  const users = await getAllUsersWithStats(200);
  return (
    <UsersTable
      rows={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        disabled: u.disabled,
        plan: u.plan,
        subscriptionStatus: u.subscriptionStatus,
        periodEnd: null as string | null,
        projectCount: u.projectCount,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
